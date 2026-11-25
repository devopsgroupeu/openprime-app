import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelmChartsList, { enabledCharts } from "../HelmChartsList";

describe("HelmChartsList", () => {
  // Chart values are never stored: an environment saved with the old
  // "customValues" flag still lists its chart, without a badge claiming more.
  it("lists a chart saved with custom values like any other", () => {
    render(
      <HelmChartsList
        environment={{
          services: {
            eks: {
              enabled: true,
              helmCharts: {
                prometheusStack: { enabled: true, customValues: true },
              },
            },
          },
        }}
      />,
    );
    expect(screen.getByText("Prometheus Stack")).toBeInTheDocument();
    expect(screen.queryByText("Custom values")).toBeNull();
  });

  // Like the wizard's Helm step and Review: Argo CD and Karpenter are always
  // installed, not chosen, so an old saved flag does not list them.
  it("leaves out the always installed charts", () => {
    const environment = {
      services: {
        eks: {
          enabled: true,
          helmCharts: {
            argocd: { enabled: true },
            karpenter: { enabled: true },
            loki: { enabled: true },
          },
        },
      },
    };
    render(<HelmChartsList environment={environment} />);

    expect(enabledCharts(environment).map(([key]) => key)).toEqual(["loki"]);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
