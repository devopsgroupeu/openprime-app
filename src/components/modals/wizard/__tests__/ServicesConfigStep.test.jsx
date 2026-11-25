import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState } from "react";
import ServicesConfigStep from "../ServicesConfigStep";
import { createEmptyEnvironment } from "../../../../config/environmentsConfig";
import { TooltipProvider } from "@/components/ui/tooltip";

// Controlled like the wizard: newEnv / setNewEnv and the expanded map.
function Harness({ initial }) {
  const [newEnv, setNewEnv] = useState(initial);
  const [expanded, setExpanded] = useState({});
  return (
    <TooltipProvider>
      <ServicesConfigStep
        newEnv={newEnv}
        setNewEnv={setNewEnv}
        expandedServices={expanded}
        setExpandedServices={setExpanded}
        onAskAI={() => {}}
      />
    </TooltipProvider>
  );
}

const renderStep = (env = createEmptyEnvironment("aws")) =>
  render(<Harness initial={env} />);

const vpcSwitch = () =>
  screen.getByRole("switch", { name: "Enable Virtual Private Cloud (VPC)" });

describe("ServicesConfigStep", () => {
  it("counts enabled services and enables them all from the menu", async () => {
    renderStep();
    expect(screen.getByText(/^0 of \d+ enabled$/)).toBeInTheDocument();

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Service actions" }),
      { button: 0, ctrlKey: false },
    );
    expect(
      await screen.findByRole("menuitem", { name: "Disable all" }),
    ).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("menuitem", { name: "Enable all" }));

    const [, enabled, total] = screen
      .getByText(/\d+ of \d+ enabled/)
      .textContent.match(/(\d+) of (\d+)/);
    expect(enabled).toBe(total);
    expect(vpcSwitch()).toHaveAttribute("aria-checked", "true");
  });

  it("filters by search and category and recovers from no results", () => {
    renderStep();
    const search = screen.getByRole("searchbox", { name: "Search services" });

    fireEvent.change(search, { target: { value: "kafka" } });
    expect(
      screen.getByRole("heading", { name: /Apache Kafka/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /VPC/ })).toBeNull();

    fireEvent.change(search, { target: { value: "no-such-service" } });
    expect(screen.getByText("No results found")).toBeInTheDocument();
    const empty = screen
      .getByText("No results found")
      .closest('[data-slot="empty-state"]');
    fireEvent.click(
      within(empty).getByRole("button", { name: "Clear search" }),
    );
    expect(search).toHaveValue("");
    expect(vpcSwitch()).toBeInTheDocument();

    const tabs = screen.getByRole("group", { name: "Category" });
    fireEvent.click(within(tabs).getByRole("button", { name: "Database" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Database" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Networking" }),
    ).toBeNull();
    expect(screen.queryByRole("switch", { name: /VPC/ })).toBeNull();
  });

  it("marks an enabled service whose prerequisite is off", () => {
    renderStep();
    fireEvent.click(
      screen.getByRole("switch", { name: /Enable Elastic Kubernetes/ }),
    );
    expect(screen.getByText("Needs VPC")).toBeInTheDocument();

    fireEvent.click(vpcSwitch());
    expect(screen.queryByText("Needs VPC")).toBeNull();
  });

  it("opens an enabled service to its catalog fields", () => {
    renderStep();
    // Off: the name is not a control, so there is nothing to open.
    expect(
      screen.queryByRole("button", { name: "Virtual Private Cloud (VPC)" }),
    ).toBeNull();

    fireEvent.click(vpcSwitch());
    const trigger = screen.getByRole("button", {
      name: "Virtual Private Cloud (VPC)",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("CIDR Block")).toBeInTheDocument();
  });
});
