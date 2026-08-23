import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import EnvironmentDetailPage from "../EnvironmentDetailPage";
import {
  StatusBadge,
  getEffectiveStatus,
} from "../environment-detail/EnvironmentHeader";
import authService from "../../services/authService";
import { server } from "../../mocks/server";

// Full-page render: needs Theme (Toast), Toast, Auth, and a router
// (useParams/useNavigate). In mock mode AuthProvider auto-authenticates.
function renderDetailPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/environments/env-001"]}>
            <Routes>
              <Route
                path="/environments/:id"
                element={<EnvironmentDetailPage />}
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

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
        /Infrastructure repository generated and downloaded successfully/i,
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
      await screen.findByText("Terraform apply failed"),
    ).toBeInTheDocument();
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
    expect(screen.getByText("succeeded")).toBeInTheDocument();

    rerender(
      <StatusBadge
        status={getEffectiveStatus({
          last_generate_at: "2026-07-01T10:00:00Z",
          last_generate_status: "failed",
        })}
      />,
    );
    expect(screen.getByText("failed")).toBeInTheDocument();

    rerender(
      <StatusBadge status={getEffectiveStatus({ status: "stopped" })} />,
    );
    expect(screen.getByText("stopped")).toBeInTheDocument();
  });
});
