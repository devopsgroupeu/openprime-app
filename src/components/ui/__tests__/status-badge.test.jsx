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
});
