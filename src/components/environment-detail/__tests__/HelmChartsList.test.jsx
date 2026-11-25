import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelmChartsList from "../HelmChartsList";

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
});
