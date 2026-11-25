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

  it("shows no draft status before anything is saved", () => {
    renderActions({ savedAt: null, onStartOver: vi.fn() });
    expect(screen.queryByText(/Draft/)).toBeNull();
  });
});
