import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import WizardTopBar from "../WizardTopBar";

const renderBar = (props) =>
  render(
    <MemoryRouter>
      <WizardTopBar
        breadcrumbs={[{ label: "New environment" }]}
        auraOpen
        onToggleAura={() => {}}
        onCancel={() => {}}
        {...props}
      />
    </MemoryRouter>,
  );

describe("WizardTopBar", () => {
  it("shows the draft time on a 24 hour clock", () => {
    renderBar({ savedAt: new Date(2026, 10, 25, 15, 7).getTime() });
    expect(screen.getByText("15:07")).toBeInTheDocument();
  });

  it("shows no draft status before anything is saved", () => {
    renderBar({ savedAt: null, onStartOver: vi.fn() });
    expect(screen.queryByText(/Draft/)).toBeNull();
  });
});
