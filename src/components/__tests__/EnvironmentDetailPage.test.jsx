import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import {
  Link,
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
import { environments } from "../../mocks/fixtures";
import { coverGradient } from "@/components/shared/cover-gradient";
import { formatRelative } from "@/components/shared/format";

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

// Push to git, confirmed in its dialog.
const push = async () => {
  fireEvent.click(await screen.findByRole("button", { name: "Push to git" }));
  fireEvent.click(
    within(await screen.findByRole("alertdialog")).getByRole("button", {
      name: "Push",
    }),
  );
};

// jsdom doesn't implement blob URL helpers or anchor navigation; stub them so
// triggerDownload() (createObjectURL -> a.click()) runs without throwing.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
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

  it("shows a failed generation in its callout, not in a toast", async () => {
    server.use(
      http.get("*/jobs/:jobId", () =>
        HttpResponse.json({
          id: "job-generate-env-001",
          status: "failed",
          error: "Terraform apply failed",
        }),
      ),
    );

    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Generate Repository/i }),
    );

    // The failure stays on the page, with Try again, announced because it
    // happened during this visit; a toast would only repeat it.
    const failure = await screen.findByText(
      "Couldn't generate the repository.",
    );
    const callout = failure.closest('[data-slot="callout"]');
    expect(callout).toHaveAttribute("role", "alert");
    expect(within(callout).getByText("Terraform apply failed")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    expect(
      toasts().queryByText("Terraform apply failed"),
    ).not.toBeInTheDocument();
  });

  it("offers Download again when the ZIP download fails, without generating again", async () => {
    let generated = 0;
    server.use(
      http.post("*/environments/env-001/generate", () => {
        generated += 1;
        return HttpResponse.json(
          { jobId: "job-generate-env-001", status: "queued" },
          { status: 202 },
        );
      }),
    );
    const getBlob = vi
      .spyOn(authService, "getBlob")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(new Blob(["PK\x03\x04 mock-zip"]));
    renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );

    const callout = (
      await screen.findByText("Couldn't download the repository.")
    ).closest('[data-slot="callout"]');
    expect(within(callout).getByText("Network error")).toBeVisible();
    fireEvent.click(
      within(callout).getByRole("button", { name: "Download again" }),
    );

    expect(
      await toasts().findByText("Repository downloaded."),
    ).toBeInTheDocument();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(getBlob).toHaveBeenCalledTimes(2);
    expect(generated).toBe(1);
    expect(
      screen.queryByText("Couldn't download the repository."),
    ).not.toBeInTheDocument();
  });

  it("starts one job when Generate is clicked twice before the page updates", async () => {
    let posted = 0;
    server.use(
      http.post("*/environments/env-001/generate", () => {
        posted += 1;
        return HttpResponse.json(
          { jobId: "job-generate-env-001", status: "queued" },
          { status: 202 },
        );
      }),
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage();
    const generate = await screen.findByRole("button", {
      name: "Generate repository",
    });

    // Both clicks land before React re-renders the disabled button.
    act(() => {
      generate.click();
      generate.click();
    });
    await screen.findByRole("button", { name: /Generating/ });
    await waitFor(() => expect(posted).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(posted).toBe(1);
    unmount();
  });

  it("reads the environment back from the server after a job", async () => {
    const done = new Date().toISOString();
    let finished = false;
    server.use(
      http.get("*/environments/env-002", () =>
        HttpResponse.json(
          finished
            ? {
                ...environments[1],
                status: "running",
                last_generate_at: done,
                last_generate_status: "succeeded",
                updated_at: done,
              }
            : environments[1],
        ),
      ),
      http.get("*/jobs/:jobId", ({ params }) => {
        finished = true;
        return HttpResponse.json({
          id: params.jobId,
          status: "succeeded",
          result: { downloadUrl: `/jobs/${params.jobId}/download` },
        });
      }),
    );
    renderDetailPage({ path: "/environments/env-002" });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );

    await toasts().findByText("Repository generated and downloaded.");
    const header = document.querySelector('[data-slot="page-header"]');
    expect(within(header).getByText("Ready")).toBeInTheDocument();
    // The server's time, not one the page made up.
    expect(within(header).getByText("now")).toBeInTheDocument();
  });

  it("keeps the page as it is when reading the environment back fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let failing = false;
    server.use(
      http.get("*/environments/env-001", () =>
        failing
          ? HttpResponse.json(
              { error: "Database unavailable" },
              { status: 503 },
            )
          : HttpResponse.json(environments[0]),
      ),
    );
    renderDetailPage();
    await screen.findByRole("heading", { level: 1, name: "demo-prod" });

    failing = true;
    await push();

    await toasts().findByText("Pushed to openprime/demo-infra.");
    expect(error).toHaveBeenCalledWith(
      "Failed to refresh the environment:",
      expect.anything(),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "demo-prod" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks before pushing, then names the repository it pushed to", async () => {
    let pushed = 0;
    server.use(
      http.post("*/environments/env-001/push", () => {
        pushed += 1;
        return HttpResponse.json(
          { jobId: "job-push-env-001", status: "queued" },
          { status: 202 },
        );
      }),
    );
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderDetailPage();

    fireEvent.click(await screen.findByRole("button", { name: "Push to git" }));
    let dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Push to openprime/demo-infra (main)?"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "OpenPrime commits the generated code to this branch.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(pushed).toBe(0);

    await push();
    const toast = (
      await toasts().findByText("Pushed to openprime/demo-infra.")
    ).closest('[data-slot="toast"]');
    expect(pushed).toBe(1);
    fireEvent.click(
      within(toast).getByRole("button", { name: "Open repository" }),
    );
    expect(open).toHaveBeenCalledWith(
      "https://github.com/openprime/demo-infra",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("runs a failed generate again from Try again", async () => {
    let generated = 0;
    server.use(
      http.post("*/environments/env-003/generate", () => {
        generated += 1;
        return HttpResponse.json(
          { jobId: "job-generate-env-003", status: "queued" },
          { status: 202 },
        );
      }),
    );
    renderDetailPage({ path: "/environments/env-003" });
    const callout = (
      await screen.findByText("Couldn't generate the repository.")
    ).closest('[data-slot="callout"]');

    fireEvent.click(within(callout).getByRole("button", { name: "Try again" }));

    expect(
      await toasts().findByText("Repository generated and downloaded."),
    ).toBeInTheDocument();
    expect(generated).toBe(1);
    // The stored outcome is now a success: the failure is gone.
    await waitFor(() =>
      expect(
        screen.queryByText("Couldn't generate the repository."),
      ).not.toBeInTheDocument(),
    );
  });

  it("asks again before Try again pushes", async () => {
    server.use(
      http.get("*/environments/env-001", () =>
        HttpResponse.json({
          ...environments[0],
          last_push_at: "2026-11-21T00:00:00Z",
          last_push_status: "failed",
          last_push_error: "Permission denied (publickey)",
        }),
      ),
    );
    renderDetailPage();
    const callout = (await screen.findByText("Couldn't push to git.")).closest(
      '[data-slot="callout"]',
    );

    fireEvent.click(within(callout).getByRole("button", { name: "Try again" }));
    expect(
      within(await screen.findByRole("alertdialog")).getByText(
        "Push to openprime/demo-infra (main)?",
      ),
    ).toBeInTheDocument();
  });

  it("offers no Try again for a failed push without a git repository", async () => {
    server.use(
      http.get("*/environments/env-002", () =>
        HttpResponse.json({
          ...environments[1],
          last_push_at: "2026-11-21T00:00:00Z",
          last_push_status: "failed",
          last_push_error: "Repository not found",
        }),
      ),
    );
    renderDetailPage({ path: "/environments/env-002" });
    const callout = (await screen.findByText("Couldn't push to git.")).closest(
      '[data-slot="callout"]',
    );

    expect(
      within(callout).queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    expect(
      within(callout).getByText(
        "Add a git repository in Edit > Basics to push.",
      ),
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
      expect(getBlobSpy).toHaveBeenCalledWith(
        "/jobs/job-generate-env-001/download",
      ),
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
    // The title already says what failed: the backend's own prefix goes.
    expect(
      screen.getByText(
        "Couldn't create the Terraform state bucket an-tf-state: AccessDenied for s3:CreateBucket. Use credentials that can create S3 buckets.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Failed to generate infrastructure/),
    ).not.toBeInTheDocument();
    expect(
      within(document.querySelector('[data-slot="page-header"]')).getByText(
        "Failed",
      ),
    ).toBeInTheDocument();
    // Already failed when the page opened: shown, not announced.
    expect(
      screen
        .getByText("Couldn't generate the repository.")
        .closest('[data-slot="callout"]'),
    ).not.toHaveAttribute("role");
  });

  // The backend can leave `deploying` behind (an expired retry stores no
  // outcome); enqueueing again re-attaches to the active job.
  it("shows a processing environment without its earlier failure and lets Generate re-attach", async () => {
    const polled = [];
    server.use(
      http.get("*/environments/env-003", () =>
        HttpResponse.json({ ...environments[2], status: "deploying" }),
      ),
      http.post("*/environments/env-003/generate", () =>
        HttpResponse.json(
          { jobId: "job-active-7", type: "generate", status: "running" },
          { status: 202 },
        ),
      ),
      http.get("*/jobs/:jobId", ({ params }) => {
        polled.push(params.jobId);
        return HttpResponse.json({ id: params.jobId, status: "running" });
      }),
    );
    const { unmount } = renderDetailPage({ path: "/environments/env-003" });

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't generate the repository."),
    ).not.toBeInTheDocument();
    const generate = screen.getByRole("button", {
      name: "Generate repository",
    });
    expect(generate).toBeEnabled();

    fireEvent.click(generate);
    await waitFor(() => expect(polled).toEqual(["job-active-7"]));
    unmount();
  });

  it("keeps Push to git enabled on a processing environment with git", async () => {
    server.use(
      http.get("*/environments/env-001", () =>
        HttpResponse.json({ ...environments[0], status: "deploying" }),
      ),
    );
    renderDetailPage();

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Push to git" })).toBeEnabled();
  });

  it("keeps the server message and the error ID when loading fails", async () => {
    server.use(
      http.get("*/environments/env-001", () =>
        HttpResponse.json(
          { error: "Database unavailable" },
          { status: 503, headers: { "X-Request-ID": "req-42" } },
        ),
      ),
    );
    renderDetailPage();

    expect(
      await screen.findByText("Couldn't load environment."),
    ).toBeInTheDocument();
    expect(screen.getByText("Database unavailable")).toBeInTheDocument();
    expect(screen.getByText("req-42")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy error ID" }),
    ).toBeInTheDocument();
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
      <Link to="/environments">All environments</Link>
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

  it("closes the leave prompt when the job ends while it is open", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let finished = false;
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json(
          finished
            ? {
                id: params.jobId,
                status: "succeeded",
                result: { downloadUrl: `/jobs/${params.jobId}/download` },
              }
            : { id: params.jobId, status: "running" },
        ),
      ),
    );
    renderDetailPage({ shell: <Shell palette /> });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    await screen.findByRole("button", { name: /Generating/ });
    fireEvent.click(screen.getByRole("button", { name: "Open palette" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "Environments" }),
    );
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    finished = true;
    // Past the first poll interval (2 s).
    await act(() => vi.advanceTimersByTimeAsync(2100));
    await toasts().findByText("Repository generated and downloaded.");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Path")).toHaveTextContent(
      "/environments/env-001",
    );
  });

  it("keeps a job and its outcome on the environment it ran on", async () => {
    // Fake clock (still ticking): the poll interval passes in no time.
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    await push();
    await screen.findByRole("button", { name: /Pushing/ });

    // Push has no leave guard: go straight to another environment.
    fireEvent.click(screen.getByRole("button", { name: "Open demo-staging" }));
    expect(
      await screen.findByRole("heading", { name: "demo-staging" }),
    ).toBeInTheDocument();
    finished = true;
    // Longer than the first poll interval (2 s): demo-prod's job would answer.
    await act(() => vi.advanceTimersByTimeAsync(2600));

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
  });

  it("asks before a link leaves a generating page, and Stay stays", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage({ shell: <Shell /> });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    await screen.findByRole("button", { name: /Generating/ });

    fireEvent.click(screen.getByRole("link", { name: "All environments" }));
    const prompt = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(prompt).getByRole("button", { name: "Stay on page" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Path")).toHaveTextContent(
      "/environments/env-001",
    );
    expect(screen.getByRole("button", { name: /Generating/ })).toBeDisabled();
    unmount();
  });

  // Below lg Edit sits in More when Generate is the primary.
  it("asks before More > Edit leaves a generating page", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage({
      path: "/environments/env-002",
      shell: <Shell />,
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    await screen.findByRole("button", { name: /Generating/ });

    const menu = await openMore("demo-staging");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Edit" }));

    const prompt = await screen.findByRole("alertdialog");
    expect(within(prompt).getByText("Leave this page?")).toBeInTheDocument();
    expect(screen.getByLabelText("Path")).toHaveTextContent(
      "/environments/env-002",
    );
    unmount();
  });

  it("says a download is in progress when leaving during Download again", async () => {
    vi.spyOn(authService, "getBlob")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockReturnValueOnce(new Promise(() => {}));
    const { unmount } = renderDetailPage({ shell: <Shell /> });
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Download again" }),
    );
    await screen.findByText("Downloading the repository.");

    fireEvent.click(screen.getByRole("link", { name: "All environments" }));
    const prompt = await screen.findByRole("alertdialog");
    expect(
      within(prompt).getByText(
        "The ZIP download is still in progress. If you leave, the file will not be saved.",
      ),
    ).toBeInTheDocument();
    expect(
      within(prompt).queryByText(/still generating/),
    ).not.toBeInTheDocument();
    unmount();
  });

  // The page stays mounted across ?tab= links, so the job is not at risk.
  it("switches tabs during a generate without asking", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage();
    fireEvent.click(
      await screen.findByRole("button", { name: "Generate repository" }),
    );
    await screen.findByRole("button", { name: /Generating/ });

    const nav = screen.getByRole("navigation", {
      name: "Environment sections",
    });
    fireEvent.click(within(nav).getByRole("link", { name: /^Services/ }));

    await waitFor(() =>
      expect(
        within(nav).getByRole("link", { name: /^Services/ }),
      ).toHaveAttribute("aria-current", "page"),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generating/ })).toBeDisabled();
    unmount();
  });
});

describe("EnvironmentDetailPage overview", () => {
  const stats = () =>
    Array.from(document.querySelectorAll('[data-slot="stat-card"]'));
  const labels = () => stats().map((card) => card.firstChild.textContent);

  it("counts services and charts and says when it was generated and pushed", async () => {
    renderDetailPage();
    await screen.findByRole("heading", { level: 1, name: "demo-prod" });

    // Not the region and modified time again: the header shows those.
    expect(labels()).toEqual([
      "Services",
      "Helm charts",
      "Last generated",
      "Last pushed",
    ]);
    expect(
      within(stats()[2]).getByText(
        formatRelative(environments[0].last_generate_at),
      ),
    ).toBeInTheDocument();
    expect(
      within(stats()[3]).getByText(
        formatRelative(environments[0].last_push_at),
      ),
    ).toBeInTheDocument();
  });

  it("leaves out Helm charts without EKS and says a generate failed", async () => {
    renderDetailPage({ path: "/environments/env-003" });
    await screen.findByRole("heading", { level: 1, name: "analytics-dev" });

    expect(labels()).toEqual(["Services", "Last generated", "Last pushed"]);
    expect(stats()[1]).toHaveTextContent("Failed");
    expect(stats()[2]).toHaveTextContent("Never");
  });
});

describe("EnvironmentDetailPage identity", () => {
  // The same band as the environment's card, so the two read as one object.
  it("shows the environment's cover band above the header", async () => {
    renderDetailPage();
    await screen.findByRole("heading", { level: 1, name: "demo-prod" });

    const bands = document.querySelectorAll('[data-slot="cover-gradient"]');
    expect(bands).toHaveLength(1);
    expect(bands[0]).toHaveAttribute("aria-hidden", "true");
    const { gradient, layout } = coverGradient("env-001");
    expect(bands[0]).toHaveAttribute("data-gradient", String(gradient));
    expect(bands[0]).toHaveAttribute("data-layout", String(layout));
  });

  it("shows the official logos of the charts and the git provider", async () => {
    renderDetailPage({ path: "/environments/env-001?tab=helm" });
    // ingress-nginx shows the icon its own chart declares.
    const nginx = await screen.findByText("Ingress NGINX Controller");
    expect(
      nginx.closest("li").querySelector('[data-slot="logo-tile"] img'),
    ).toHaveAttribute("src", "/assets/chart-logos/ingress-nginx.png");
    const prometheus = screen.getByText("Prometheus Stack");
    expect(
      prometheus.closest("li").querySelector('[data-slot="logo-tile"] img'),
    ).toHaveAttribute("src", "/assets/chart-logos/prometheus.svg");

    fireEvent.click(screen.getByRole("link", { name: "Overview" }));
    const repo = await screen.findByText("openprime/demo-infra");
    expect(
      repo.closest("dd").querySelector('[data-slot="logo-tile"] img'),
    ).toHaveAttribute("src", "/assets/chart-logos/github.svg");
  });
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

const openMore = async (name) => {
  fireEvent.pointerDown(
    await screen.findByRole("button", { name: `More actions for ${name}` }),
    { button: 0, ctrlKey: false },
  );
  return screen.findByRole("menu");
};

describe("EnvironmentDetailPage header actions", () => {
  it("keeps Delete disabled while a job runs", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    const { unmount } = renderDetailPage();
    await push();
    await screen.findByRole("button", { name: /Pushing/ });

    const menu = await openMore("demo-prod");
    expect(
      within(menu).getByRole("menuitem", { name: "Delete environment" }),
    ).toHaveAttribute("data-disabled");
    unmount();
  });

  it("says in the menu why Push to git is unavailable", async () => {
    renderDetailPage({ path: "/environments/env-002" });

    const menu = await openMore("demo-staging");
    const push = within(menu).getByRole("menuitem", { name: "Push to git" });
    expect(push).toHaveAttribute("data-disabled");
    expect(push).toHaveAccessibleDescription(
      "Add a git repository in Edit > Basics to push.",
    );
  });
});

// The filled button is the next step: Generate until the environment is
// generated (or after a failure), Edit afterwards.
describe("EnvironmentDetailPage primary action", () => {
  const variant = (name) =>
    screen.getByRole(name === "Edit" ? "link" : "button", { name }).dataset
      .variant;

  it.each([
    ["env-002", "demo-staging", "Generate repository", "Edit"],
    ["env-003", "analytics-dev", "Generate repository", "Edit"],
    ["env-001", "demo-prod", "Edit", "Generate repository"],
  ])("%s (%s): %s is primary", async (id, name, primary, other) => {
    renderDetailPage({ path: `/environments/${id}` });
    await screen.findByRole("heading", { level: 1, name });

    expect(variant(primary)).toBe("default");
    expect(variant(other)).toBe("secondary");
    // Below lg only the primary stays a button; the menu holds the other.
    const menu = await openMore(name);
    expect(
      within(menu).getByRole("menuitem", { name: other }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", { name: primary }),
    ).not.toBeInTheDocument();
  });
});

describe("EnvironmentDetailPage configuration", () => {
  it("rotates the SSH key with one verb throughout", async () => {
    renderDetailPage({ path: "/environments/env-001?tab=configuration" });

    fireEvent.click(await screen.findByRole("button", { name: "Rotate key" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Rotate SSH key")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("SSH private key"), {
      target: { value: "-----BEGIN OPENSSH PRIVATE KEY-----" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Rotate key" }));

    expect(await toasts().findByText("SSH key rotated.")).toBeInTheDocument();
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
      await toasts().findByText("Couldn't delete demo-prod: Server said no"),
    ).toBeInTheDocument();
    expect(toasts().getByText(/Server said no/)).toBeInTheDocument();
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
