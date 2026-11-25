import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import HelmChartsList, { enabledCharts } from "../HelmChartsList";

describe("HelmChartsList", () => {
  // The old app saved only the "customValues" flag (and chart defaults set it):
  // without a values text the chart lists like any other, no badge.
  it("lists a chart saved with only the custom values flag like any other", () => {
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

  it("marks a chart with custom values and shows them read-only", () => {
    const values = "grafana:\n  replicas: 2";
    render(
      // The copy button reports a failure as a toast.
      <ThemeProvider>
        <ToastProvider>
          <TooltipProvider>
            <HelmChartsList
              environment={{
                services: {
                  eks: {
                    enabled: true,
                    helmCharts: {
                      prometheusStack: {
                        enabled: true,
                        customValues: true,
                        values,
                      },
                      loki: { enabled: true, customValues: true },
                    },
                  },
                },
              }}
            />
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>,
    );
    const row = screen.getByRole("button", { name: /Prometheus Stack/ });
    expect(within(row).getByText("Custom values")).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Loki/ })).toBeNull();

    fireEvent.click(row);
    const item = row.closest("li");
    expect(item.querySelector("pre").textContent).toBe(values);
    expect(
      within(item).getByRole("button", { name: "Copy values" }),
    ).toBeInTheDocument();
    expect(item.querySelector("textarea, input")).toBeNull();
  });
});
