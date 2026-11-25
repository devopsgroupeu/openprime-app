import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import EnvironmentDetailPage from "../EnvironmentDetailPage";
import CommandPalette from "../layout/CommandPalette";
import { getEffectiveStatus } from "../../utils/environmentStats";
import { StatusBadge } from "@/components/ui/status-badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import authService from "../../services/authService";
import { server } from "../../mocks/server";

// Full-page render: needs Theme (Toast), Toast, Auth, tooltips (the app shell
// provides them) and a router (useParams/useNavigate). In mock mode
// AuthProvider auto-authenticates.
// `shell` renders next to the routes, inside the router (palette, probes).
function renderDetailPage({
  path = "/environments/env-001",
  onDelete = vi.fn(),
  shell = null,
} = {}) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[path]}>
              {shell}
              <Routes>
                <Route
                  path="/environments/:id"
                  element={<EnvironmentDetailPage onDelete={onDelete} />}
                />
                <Route
                  path="/environments"
                  element={<p>Environments list</p>}
                />
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

// Toasts render in the "Notifications" region; the page may show the same
// text inline (the job callout).
const toasts = () => within(screen.getByLabelText("Notifications"));

// jsdom doesn't implement blob URL helpers or anchor navigation; stub them so
// triggerDownload() (createObjectURL -> a.click()) runs without throwing.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EnvironmentDetailPage async jobs", () => {
  it("generates: polls queued -> running -> succeeded, downloads, and shows a success toast", async () => {
    let pollCount = 0;
    server.use(
      http.get("*/jobs/:jobId", ({ params }) => {
        pollCount += 1;
        if (pollCount === 1) {
          return HttpResponse.json({ id: params.jobId, status: "queued" });
        }
        if (pollCount === 2) {
          return HttpResponse.json({ id: params.jobId, status: "running" });
        }
        return HttpResponse.json({
          id: params.jobId,
          status: "succeeded",
          result: { downloadUrl: `/jobs/${params.jobId}/download` },
        });
      }),
    );

    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Generate Repository/i }),
    );

    expect(
      await screen.findByText(
        /Repository generated and downloaded/i,
        {},
        { timeout: 10000 },
      ),
    ).toBeInTheDocument();

    // The artifact was actually downloaded (anchor click fired).
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    // Polling observed the queued -> running -> succeeded transitions.
    expect(pollCount).toBe(3);
  }, 15000);

  it("shows the job error toast when generation fails", async () => {
    server.use(
      http.get("*/jobs/:jobId", () =>
        HttpResponse.json({
          id: "job-gen-1",
          status: "failed",
          error: "Terraform apply failed",
        }),
      ),
    );

    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Generate Repository/i }),
    );

    expect(
      await toasts().findByText("Terraform apply failed"),
    ).toBeInTheDocument();
    // The failure also stays on the page, with Try again, announced because
    // it happened during this visit.
    const failure = screen.getByText("Couldn't generate the repository.");
    expect(failure.closest('[data-slot="callout"]')).toHaveAttribute(
      "role",
      "alert",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it("pushes: 202 -> succeeded and shows the result message toast", async () => {
    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Push to Git/i }),
    );

    expect(
      await screen.findByText("Infrastructure pushed to Git"),
    ).toBeInTheDocument();
  });

  it("requests the download from /jobs/<id>/download (no /api prefix)", async () => {
    const getBlobSpy = vi
      .spyOn(authService, "getBlob")
      .mockResolvedValue(new Blob(["PK\x03\x04 mock-zip"]));

    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Generate Repository/i }),
    );

    await waitFor(() =>
      expect(getBlobSpy).toHaveBeenCalledWith("/jobs/job-gen-1/download"),
    );
  });

  it("disables both job buttons while a job runs and shows its progress", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );

    const { unmount } = renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );

    expect(
      await screen.findByRole("button", { name: /Generating/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Push to git" })).toBeDisabled();
    expect(
      screen.getByText("Generating repository. This can take a few minutes."),
    ).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
    unmount();
  });

  it("shows the last stored failure with Try again", async () => {
    renderDetailPage({ path: "/environments/env-003" });

    expect(
      await screen.findByText("Couldn't generate the repository."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/AccessDenied for s3:CreateBucket/),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    // Already failed when the page opened: shown, not announced.
    expect(
      screen
        .getByText("Couldn't generate the repository.")
        .closest('[data-slot="callout"]'),
    ).not.toHaveAttribute("role");
  });

  it("titles a missing environment Environment not found", async () => {
    renderDetailPage({ path: "/environments/env-missing" });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This environment doesn't exist or you don't have access.",
      }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Environment not found - OpenPrime");
  });
});

// The current path, and a plain (unguarded) navigation, as the shell would do.
function Shell({ palette = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <output aria-label="Path">{location.pathname}</output>
      <button type="button" onClick={() => navigate("/environments/env-002")}>
        Open demo-staging
      </button>
      {palette ? (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open palette
          </button>
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            onShortcuts={() => {}}
            environments={[]}
          />
        </>
      ) : null}
    </>
  );
}

describe("EnvironmentDetailPage leaving during a job", () => {
  it("asks before the command palette leaves a generating page", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage({ shell: <Shell palette /> });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    await screen.findByRole("button", { name: /Generating/ });

    fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "Environments" }),
    );

    const prompt = await screen.findByRole("alertdialog");
    expect(within(prompt).getByText("Leave this page?")).toBeInTheDocument();
    expect(screen.getByLabelText("Path")).toHaveTextContent(
      "/environments/env-001",
    );
    fireEvent.click(within(prompt).getByRole("button", { name: "Leave" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Path")).toHaveTextContent(
        /^\/environments$/,
      ),
    );
    unmount();
  });

  it("keeps a job and its outcome on the environment it ran on", async () => {
    let finished = false;
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json(
          finished
            ? {
                id: params.jobId,
                status: "failed",
                error: "Push of demo-prod failed",
              }
            : { id: params.jobId, status: "running" },
        ),
      ),
    );
    renderDetailPage({ shell: <Shell /> });
    fireEvent.click(await screen.findByRole("button", { name: "Push to git" }));
    await screen.findByRole("button", { name: /Pushing/ });

    // Push has no leave guard: go straight to another environment.
    fireEvent.click(screen.getByRole("button", { name: "Open demo-staging" }));
    expect(
      await screen.findByRole("heading", { name: "demo-staging" }),
    ).toBeInTheDocument();
    finished = true;
    // Longer than the first poll interval (2 s): demo-prod's job would answer.
    await new Promise((resolve) => setTimeout(resolve, 2600));

    expect(screen.getByText("Not generated")).toBeInTheDocument();
    expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    expect(screen.queryByText(/Pushing/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Push of demo-prod failed/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't push to git.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate repository" }),
    ).toBeEnabled();
  }, 10000);
});

describe("EnvironmentDetailPage tabs", () => {
  it("renders the tab from ?tab= and marks its link as current", async () => {
    renderDetailPage({ path: "/environments/env-001?tab=services" });

    const nav = await screen.findByRole("navigation", {
      name: "Environment sections",
    });
    expect(
      within(nav).getByRole("link", { name: /^Services/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Overview" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(nav).getByRole("link", { name: "Configuration" }),
    ).toHaveAttribute("href", "/environments/env-001?tab=configuration");
    expect(
      screen.getByRole("button", { name: /Expand all/ }),
    ).toBeInTheDocument();
  });

  it("falls back to Overview for an unknown tab and hides Helm charts without charts", async () => {
    renderDetailPage({ path: "/environments/env-003?tab=helm" });

    const nav = await screen.findByRole("navigation", {
      name: "Environment sections",
    });
    expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).queryByRole("link", { name: /Helm charts/ }),
    ).not.toBeInTheDocument();
  });
});

describe("EnvironmentDetailPage delete", () => {
  it("confirms from the menu and deletes only after the name is typed", async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    renderDetailPage({ onDelete });

    fireEvent.pointerDown(
      await screen.findByRole("button", { name: "More actions for demo-prod" }),
      { button: 0, ctrlKey: false },
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Delete environment" }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText('Delete "demo-prod"?')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /Terraform state bucket and code already pushed/,
      ),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Delete" });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.change(
      within(dialog).getByLabelText("Type demo-prod to confirm"),
      {
        target: { value: "demo-prod" },
      },
    );
    fireEvent.click(confirm);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("env-001"));
    expect(await screen.findByText("Environments list")).toBeInTheDocument();
    expect(toasts().getByText("Deleted demo-prod.")).toBeInTheDocument();
  });

  it("toasts a failed delete and stays on the page", async () => {
    const onDelete = vi.fn(() => Promise.reject(new Error("Server said no")));
    renderDetailPage({ onDelete });

    fireEvent.pointerDown(
      await screen.findByRole("button", { name: "More actions for demo-prod" }),
      { button: 0, ctrlKey: false },
    );
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Delete environment" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.change(
      within(dialog).getByLabelText("Type demo-prod to confirm"),
      {
        target: { value: "demo-prod" },
      },
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await toasts().findByText("Couldn't delete demo-prod"),
    ).toBeInTheDocument();
    expect(toasts().getByText("Server said no")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "demo-prod" }),
    ).toBeInTheDocument();
  });
});

describe("getEffectiveStatus", () => {
  it("returns the generate job outcome when only generate ran", () => {
    expect(
      getEffectiveStatus({
        last_generate_at: "2026-07-01T10:00:00Z",
        last_generate_status: "succeeded",
      }),
    ).toBe("succeeded");
  });

  it("returns the push job outcome when only push ran", () => {
    expect(
      getEffectiveStatus({
        last_push_at: "2026-07-01T10:00:00Z",
        last_push_status: "failed",
      }),
    ).toBe("failed");
  });

  it("returns the most recent job outcome when both ran", () => {
    expect(
      getEffectiveStatus({
        last_generate_at: "2026-07-01T10:00:00Z",
        last_generate_status: "succeeded",
        last_push_at: "2026-07-02T10:00:00Z",
        last_push_status: "failed",
      }),
    ).toBe("failed");
  });

  it("falls back to environment.status when no job ran", () => {
    expect(getEffectiveStatus({ status: "running" })).toBe("running");
    expect(getEffectiveStatus({})).toBe("pending");
  });
});

describe("StatusBadge", () => {
  it("renders the effective job status text", () => {
    const { rerender } = render(
      <StatusBadge
        status={getEffectiveStatus({
          last_generate_at: "2026-07-01T10:00:00Z",
          last_generate_status: "succeeded",
        })}
      />,
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();

    rerender(
      <StatusBadge
        status={getEffectiveStatus({
          last_generate_at: "2026-07-01T10:00:00Z",
          last_generate_status: "failed",
        })}
      />,
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();

    rerender(
      // A lifecycle status without a job outcome still renders its label.
      <StatusBadge status={getEffectiveStatus({ status: "stopped" })} />,
    );
    expect(screen.getByText("Stopped")).toBeInTheDocument();
  });
});
