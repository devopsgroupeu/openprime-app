import { render, screen } from "@testing-library/react";

import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders running as a success badge", () => {
    render(<StatusBadge status="running" />);
    const badge = screen.getByText("Running");
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

  // Every environment status (backend enum + job outcomes): label, tone and
  // the StatusPill that draws it (data-status names what is shown).
  it.each([
    ["running", "Running", "success", "ready"],
    ["succeeded", "Succeeded", "success", "ready"],
    ["stopped", "Stopped", "neutral", "stopped"],
    ["failed", "Failed", "destructive", "failed"],
    ["error", "Error", "destructive", "failed"],
    ["pending", "Pending", "warning", "processing"],
    ["deploying", "Deploying", "warning", "processing"],
    ["queued", "Queued", "warning", "processing"],
    ["destroyed", "Destroyed", "neutral", "unknown"],
    [undefined, "Unknown", "neutral", "unknown"],
  ])("renders %s as %s (%s)", (status, label, tone, pill) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute("data-tone", tone);
    expect(badge).toHaveAttribute("data-status", pill);
  });

  it("shows a spinner only for in-flight statuses", () => {
    const { container, rerender } = render(<StatusBadge status="deploying" />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    rerender(<StatusBadge status="stopped" />);
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
