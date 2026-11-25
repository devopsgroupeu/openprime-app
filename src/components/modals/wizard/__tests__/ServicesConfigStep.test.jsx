import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";
import ServicesConfigStep from "../ServicesConfigStep";
import { createEmptyEnvironment } from "../../../../config/environmentsConfig";
import { hydrateServicesConfig } from "../../../../config/servicesConfig";
import catalogFixture from "../../../../mocks/catalog.json";
import { TooltipProvider } from "@/components/ui/tooltip";
import aiSymbol from "@/assets/openprime-ai-symbol-color.svg";

// Controlled like the wizard: newEnv / setNewEnv and the expanded map.
// `onEnv` sees every environment the step sets.
function Harness({ initial, onEnv, focusHeading }) {
  const [newEnv, setNewEnv] = useState(initial);
  const [expanded, setExpanded] = useState({});
  return (
    <TooltipProvider>
      <ServicesConfigStep
        newEnv={newEnv}
        setNewEnv={(env) => {
          onEnv?.(env);
          setNewEnv(env);
        }}
        expandedServices={expanded}
        setExpandedServices={setExpanded}
        onAskAI={() => {}}
        focusHeading={focusHeading}
      />
    </TooltipProvider>
  );
}

const renderStep = (env = createEmptyEnvironment("aws"), onEnv) =>
  render(<Harness initial={env} onEnv={onEnv} />);

const openActions = () =>
  fireEvent.pointerDown(
    screen.getByRole("button", { name: "Service actions" }),
    { button: 0, ctrlKey: false },
  );

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

  it("keeps the settings of configured services on Enable all", async () => {
    const env = createEmptyEnvironment("aws");
    env.services.vpc = {
      ...env.services.vpc,
      enabled: true,
      cidr: "10.1.0.0/16",
    };
    const onEnv = vi.fn();
    renderStep(env, onEnv);

    openActions();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Enable all" }),
    );

    const { services } = onEnv.mock.lastCall[0];
    expect(services.vpc.cidr).toBe("10.1.0.0/16");
    expect(services.eks.enabled).toBe(true);
    // The cluster keeps its chart selection.
    expect(services.eks.helmCharts).toEqual(env.services.eks.helmCharts);
  });

  it("starts a preset only with services the catalog offers", () => {
    const env = createEmptyEnvironment("aws");
    delete env.services.rds;
    const onEnv = vi.fn();
    renderStep(env, onEnv);

    fireEvent.click(screen.getByRole("button", { name: "Basic stack" }));

    const { services } = onEnv.mock.lastCall[0];
    expect(services.vpc.enabled).toBe(true);
    expect(services.s3.enabled).toBe(true);
    expect(services).not.toHaveProperty("rds");
  });

  // The presets stay when one enables nothing, so focus stays on it.
  it("keeps focus on a preset that enables nothing", () => {
    const env = createEmptyEnvironment("aws");
    delete env.services.vpc;
    delete env.services.eks;
    const focusHeading = vi.fn();
    render(<Harness initial={env} focusHeading={focusHeading} />);

    const preset = screen.getByRole("button", { name: "VPC and EKS" });
    preset.focus();
    fireEvent.click(preset);

    expect(screen.getByText(/^0 of \d+ enabled$/)).toBeInTheDocument();
    expect(focusHeading).not.toHaveBeenCalled();
    expect(preset).toHaveFocus();
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

  // A catalog service without a category is grouped under "Other", and the
  // "Other" tab has to find it there.
  it("filters a service without a category under Other", () => {
    const { category, ...uncategorized } = catalogFixture.services.sqs;
    expect(category).toBeTruthy();
    hydrateServicesConfig({
      ...catalogFixture,
      services: {
        ...catalogFixture.services,
        ledger: { ...uncategorized, key: "ledger", displayName: "Ledger" },
      },
    });
    try {
      renderStep();
      const tabs = screen.getByRole("group", { name: "Category" });
      fireEvent.click(within(tabs).getByRole("button", { name: "Other" }));
      expect(
        screen.getByRole("heading", { level: 3, name: "Ledger" }),
      ).toBeInTheDocument();
    } finally {
      hydrateServicesConfig(catalogFixture);
    }
  });

  it("marks an enabled service whose prerequisite is off", () => {
    renderStep();
    fireEvent.click(
      screen.getByRole("switch", { name: /Enable Elastic Kubernetes/ }),
    );
    expect(
      screen.getByText("Needs Virtual Private Cloud (VPC)"),
    ).toBeInTheDocument();

    fireEvent.click(vpcSwitch());
    expect(screen.queryByText("Needs Virtual Private Cloud (VPC)")).toBeNull();
  });

  it("opens a service to its catalog fields when it is switched on", () => {
    renderStep();
    // Off: the name is not a control, so there is nothing to open.
    expect(
      screen.queryByRole("button", { name: "Virtual Private Cloud (VPC)" }),
    ).toBeNull();

    // A pointer click: the switch keeps focus.
    vpcSwitch().focus();
    fireEvent.click(vpcSwitch(), { detail: 1 });
    const trigger = screen.getByRole("button", {
      name: "Virtual Private Cloud (VPC)",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("CIDR Block")).toBeInTheDocument();
    expect(vpcSwitch()).toHaveFocus();

    // The name still closes and opens it.
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  // Enter and Space click with detail 0.
  it("moves focus to the first field when switched on from the keyboard", () => {
    renderStep();
    vpcSwitch().focus();
    fireEvent.click(vpcSwitch(), { detail: 0 });
    expect(screen.getByLabelText("CIDR Block")).toHaveFocus();

    // Switching it off and on with the pointer leaves focus on the switch.
    fireEvent.click(vpcSwitch(), { detail: 0 });
    vpcSwitch().focus();
    fireEvent.click(vpcSwitch(), { detail: 1 });
    expect(vpcSwitch()).toHaveFocus();
  });

  // jsdom applies no media queries, so the responsive recipe is pinned: two
  // lines of description below md, the row's Aura button only on hover or
  // focus there and up (the Aura panel's prompts cover phones).
  it("gives the description room on phones and shows Aura on hover", () => {
    renderStep();
    expect(
      screen.getByText("AWS Virtual Private Cloud for network isolation"),
    ).toHaveClass("max-md:line-clamp-2", "md:truncate");
    expect(
      screen.getByRole("button", {
        name: "Ask Aura about Virtual Private Cloud (VPC)",
      }),
    ).toHaveClass(
      "max-md:hidden",
      "opacity-0",
      "group-hover/service:opacity-100",
      "group-focus-within/service:opacity-100",
      "pointer-coarse:opacity-100",
    );
  });

  // Spec 38: "Ask Aura" on a service shows Aura's mark.
  it("marks Ask Aura on a service with the OpenPrime AI symbol", () => {
    renderStep();
    const ask = screen.getByRole("button", {
      name: "Ask Aura about Virtual Private Cloud (VPC)",
    });
    const mark = ask.querySelector('[data-slot="aura-mark"]');
    expect(mark).toHaveAttribute("src", aiSymbol);
    expect(mark).toHaveAttribute("aria-hidden");
    expect(ask.querySelector("svg")).toBeNull();
  });

  it("keeps services closed on Enable all", async () => {
    renderStep();
    openActions();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Enable all" }),
    );
    expect(
      screen.getByRole("button", { name: "Virtual Private Cloud (VPC)" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
