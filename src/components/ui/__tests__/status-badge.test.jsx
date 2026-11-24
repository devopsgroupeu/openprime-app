import { render, screen } from "@testing-library/react";

import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  // Legacy lifecycle "running" reads as Ready (OpenPrime never deploys).
  it("renders running as a success badge", () => {
    render(<StatusBadge status="running" />);
    const badge = screen.getByText("Ready");
    expect(badge).toHaveAttribute("data-tone", "success");
  });

  it("renders failed as a destructive badge", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("Failed")).toHaveAttribute(
      "data-tone",
      "destructive",
    );
  });

  it("falls back to a neutral badge with the raw label", () => {
    render(<StatusBadge status="something" />);
    expect(screen.getByText("Something")).toHaveAttribute(
      "data-tone",
      "neutral",
    );
  });

  // Every effective status (job outcomes + backend enum): label, tone and
  // the StatusPill that draws it (data-status names what is shown).
  it.each([
    ["succeeded", "Ready", "success", "ready"],
    ["failed", "Failed", "destructive", "failed"],
    ["pending", "Not generated", "neutral", "notGenerated"],
    ["queued", "Processing", "warning", "processing"],
    ["deploying", "Processing", "warning", "processing"],
    ["running", "Ready", "success", "ready"],
    ["error", "Failed", "destructive", "failed"],
    ["stopped", "Stopped", "neutral", "stopped"],
    ["destroyed", "Destroyed", "neutral", "unknown"],
    [undefined, "Unknown", "neutral", "unknown"],
  ])("renders %s as %s (%s)", (status, label, tone, pill) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute("data-tone", tone);
    expect(badge).toHaveAttribute("data-status", pill);
  });

  it("shows a spinner only while a job runs, not before the first one", () => {
    const { container, rerender } = render(<StatusBadge status="deploying" />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    rerender(<StatusBadge status="pending" />);
    expect(container.querySelector(".animate-spin")).toBeNull();
    rerender(<StatusBadge status="stopped" />);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
