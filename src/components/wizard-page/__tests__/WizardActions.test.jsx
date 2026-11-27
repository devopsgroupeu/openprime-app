import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import WizardActions from "../WizardActions";

const renderActions = (props) =>
  render(
    <WizardActions
      auraOpen
      onToggleAura={() => {}}
      onCancel={() => {}}
      {...props}
    />,
  );

describe("WizardActions", () => {
  it("shows the draft time on a 24 hour clock", () => {
    renderActions({ savedAt: new Date(2026, 10, 25, 15, 7).getTime() });
    expect(screen.getByText("15:07")).toBeInTheDocument();
  });

  // The toggle shows Aura's mark, so the open column needs its own look:
  // the pressed state of a toggle (openprime-ai Toggle "on").
  it("looks pressed while the Aura column is open", () => {
    renderActions({ auraOpen: true });
    const toggle = screen.getByRole("button", { name: "Aura", pressed: true });
    expect(toggle).toHaveClass(
      "aria-pressed:bg-accent",
      "aria-pressed:text-accent-foreground",
    );
    expect(toggle.querySelector('[data-slot="aura-mark"]')).not.toBeNull();
  });

  it("shows no draft status before anything is saved", () => {
    renderActions({ savedAt: null, onStartOver: vi.fn() });
    expect(screen.queryByText(/Draft/)).toBeNull();
  });
});
