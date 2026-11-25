import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import HelmChartsStep from "../HelmChartsStep";
import { generateDefaultHelmChartsConfig } from "../../../../config/helmChartsConfig";

// Stateful harness: HelmChartsStep is controlled (newEnv / setNewEnv), so the
// quick-start buttons need a real state owner to observe — mirrors the wizard.
function Harness({ initial, onChange }) {
  const [newEnv, setNewEnv] = useState(initial);
  const set = (next) => {
    const value = typeof next === "function" ? next(newEnv) : next;
    onChange?.(value);
    setNewEnv(value);
  };
  return <HelmChartsStep newEnv={newEnv} setNewEnv={set} />;
}

const envWith = (k8sServiceName) => ({
  name: "walk",
  provider: k8sServiceName === "eks" ? "aws" : "gcp",
  services: {
    [k8sServiceName]: { enabled: true, helmCharts: {} },
  },
});

const chartsAfterIngressStack = (k8sServiceName) => {
  let latest = null;
  render(
    <Harness
      initial={envWith(k8sServiceName)}
      onChange={(v) => (latest = v)}
    />,
  );
  fireEvent.click(screen.getByText("Ingress stack"));
  return latest?.services?.[k8sServiceName]?.helmCharts || {};
};

const enabledNames = (charts) =>
  Object.entries(charts)
    .filter(([, c]) => c?.enabled)
    .map(([name]) => name)
    .sort();

describe("HelmChartsStep — Ingress Stack quick template (OP-234)", () => {
  it("ships the AWS Load Balancer Controller with the stack on EKS", () => {
    // REGRESSION: without the controller, ingress-nginx's Service of type
    // LoadBalancer never gets an address, ArgoCD blocks on its health and never
    // applies the Deployment. The 2026-09-02 walkthrough left a cluster whose
    // ingress-nginx namespace held zero pods, permanently, with nothing on
    // screen explaining it.
    const charts = chartsAfterIngressStack("eks");
    expect(enabledNames(charts)).toEqual([
      "awsLoadBalancerController",
      "certManager",
      "externalDns",
      "ingressNginx",
    ]);
  });

  it("does not offer the EKS-only controller on a non-EKS cluster", () => {
    // awsLoadBalancerController is k8sServices: ["eks"]. The stack is offered
    // for AKS/GKE too, so enabling it unconditionally would put a chart into the
    // config that the selector cannot render and generation would drop.
    const charts = chartsAfterIngressStack("gke");
    expect(enabledNames(charts)).toEqual([
      "certManager",
      "externalDns",
      "ingressNginx",
    ]);
    expect(charts.awsLoadBalancerController).toBeUndefined();
  });

  it("keeps entries it does not own instead of replacing the map", () => {
    // The panel only renders while nothing is enabled (getEnabledChartsCount()
    // === 0), so a previously *enabled* chart cannot reach this button. What the
    // spread does guard is a disabled entry carrying customValues, which must
    // survive rather than be wiped.
    let latest = null;
    const initial = envWith("eks");
    initial.services.eks.helmCharts = {
      prometheusStack: { enabled: false, customValues: true },
    };
    render(<Harness initial={initial} onChange={(v) => (latest = v)} />);
    fireEvent.click(screen.getByText("Ingress stack"));
    expect(latest.services.eks.helmCharts.prometheusStack).toEqual({
      enabled: false,
      customValues: true,
    });
  });
});

describe("HelmChartsStep categories", () => {
  it("opens the categories that hold a selected chart", () => {
    render(<Harness initial={envWith("eks")} />);
    const category = (name) =>
      screen.getByRole("button", { name: new RegExp(`^${name}`) });
    expect(category("Networking")).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByText("Ingress stack"));
    expect(category("Networking")).toHaveAttribute("aria-expanded", "true");
    expect(category("Monitoring")).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("switch", { name: "Install Ingress NGINX Controller" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});

// Argo CD and Karpenter are always installed and have no switch here.
describe("HelmChartsStep count", () => {
  it("counts only the charts the step shows", () => {
    const initial = envWith("eks");
    initial.services.eks.helmCharts = {
      argocd: { enabled: true, customValues: false },
      karpenter: { enabled: true },
    };
    render(<Harness initial={initial} />);
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Monitoring stack" }),
    ).toBeInTheDocument();
  });

  it("offers no preset that only enables an always-installed chart", () => {
    render(<Harness initial={envWith("eks")} />);
    expect(screen.queryByRole("button", { name: "GitOps setup" })).toBeNull();
  });
});

// Custom values: a YAML string kept under helmCharts.<chart>.values, with
// customValues: true. Generation does not read it yet.
describe("HelmChartsStep custom values", () => {
  const withCharts = (helmCharts) => {
    const initial = envWith("eks");
    initial.services.eks.helmCharts = helmCharts;
    return initial;
  };
  const renderCharts = (helmCharts) => {
    const state = { latest: null };
    render(
      <Harness
        initial={withCharts(helmCharts)}
        onChange={(v) => (state.latest = v)}
      />,
    );
    return () => state.latest?.services.eks.helmCharts;
  };
  const dialog = () => screen.getByRole("dialog");
  const editor = () =>
    within(dialog()).getByRole("textbox", { name: "Values" });
  const type = (text) =>
    fireEvent.change(editor(), { target: { value: text } });
  const save = () =>
    fireEvent.click(
      within(dialog()).getByRole("button", { name: "Save values" }),
    );

  it("saves the values of an enabled chart and shows them when reopened", async () => {
    const charts = renderCharts({
      prometheusStack: { enabled: true, customValues: false },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    );
    expect(dialog()).toHaveAccessibleName("Prometheus Stack");
    expect(dialog()).toHaveAccessibleDescription(
      "These values are saved with the environment, but generated repositories do not apply them yet.",
    );
    expect(editor()).toHaveValue("");

    type("\ngrafana:\n  replicas: 2\n\n");
    save();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(charts().prometheusStack).toEqual({
      enabled: true,
      customValues: true,
      values: "grafana:\n  replicas: 2",
    });
    const row = screen.getByText("Prometheus Stack").closest("li");
    expect(within(row).getByText("Custom values")).toBeInTheDocument();

    fireEvent.click(
      within(row).getByRole("button", {
        name: "Edit values for Prometheus Stack",
      }),
    );
    expect(editor()).toHaveValue("grafana:\n  replicas: 2");
  });

  it("offers custom values only on enabled charts", () => {
    renderCharts({ loki: { enabled: false, customValues: true } });
    expect(
      screen.queryByRole("button", { name: /custom values for/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /edit values for/i }),
    ).toBeNull();
  });

  it("blocks invalid YAML with its line and keeps the dialog open", async () => {
    const charts = renderCharts({
      prometheusStack: { enabled: true, customValues: false },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    );
    type("grafana:\n  replicas: 2\n bad: x");
    save();

    // The line is ours; the message is the parser's and may change.
    const error = await within(dialog()).findByRole("alert");
    expect(error).toHaveTextContent(/^Line 3: \S/);
    expect(editor()).toHaveAttribute("aria-invalid", "true");
    expect(editor()).toHaveAccessibleDescription(error.textContent);
    expect(charts()).toBeUndefined();
  });

  it("blocks values that are not a mapping at the top level", async () => {
    const charts = renderCharts({
      prometheusStack: { enabled: true, customValues: false },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    );
    type("- grafana\n- alertmanager");
    save();

    expect(
      await within(dialog()).findByText(
        "Values must be a mapping of keys, such as replicaCount: 2.",
      ),
    ).toBeInTheDocument();
    expect(editor()).toHaveAttribute("aria-invalid", "true");
    expect(charts()).toBeUndefined();
  });

  it("blocks values over 64 KB", async () => {
    const charts = renderCharts({
      prometheusStack: { enabled: true, customValues: false },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    );
    type(`note: ${"x".repeat(70 * 1024)}`);
    save();

    expect(
      await within(dialog()).findByText(
        "Values can be up to 64 KB. These are 71 KB.",
      ),
    ).toBeInTheDocument();
    expect(charts()).toBeUndefined();
  });

  it("clears values: no values key and customValues off", async () => {
    const charts = renderCharts({
      prometheusStack: {
        enabled: true,
        customValues: true,
        values: "grafana:\n  replicas: 2",
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Edit values for Prometheus Stack" }),
    );
    fireEvent.click(
      within(dialog()).getByRole("button", { name: "Clear values" }),
    );
    expect(editor()).toHaveValue("");
    save();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(charts().prometheusStack).toEqual({
      enabled: true,
      customValues: false,
    });
    expect(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    ).toBeInTheDocument();
  });

  // Loki's default entry carries customValues: true without values; saving
  // an untouched editor must not rewrite it (or dirty the wizard).
  it("changes nothing when Save is pressed without a change", async () => {
    const charts = renderCharts({
      loki: { enabled: true, customValues: true },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add custom values for Loki" }),
    );
    save();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(charts()).toBeUndefined();
  });

  // Stored by another client with a trailing newline: still untouched.
  it("leaves stored values as they are when Save is pressed without a change", async () => {
    const charts = renderCharts({
      prometheusStack: {
        enabled: true,
        customValues: true,
        values: "grafana:\n  replicas: 2\n",
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Edit values for Prometheus Stack" }),
    );
    save();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(charts()).toBeUndefined();
  });

  it("offers Clear values only when the chart has values", () => {
    renderCharts({ prometheusStack: { enabled: true, customValues: false } });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Add custom values for Prometheus Stack",
      }),
    );
    expect(
      within(dialog()).queryByRole("button", { name: "Clear values" }),
    ).toBeNull();
  });

  it("discards unsaved text on Cancel", async () => {
    const charts = renderCharts({
      prometheusStack: {
        enabled: true,
        customValues: true,
        values: "grafana:\n  replicas: 2",
      },
    });
    const edit = () =>
      fireEvent.click(
        screen.getByRole("button", {
          name: "Edit values for Prometheus Stack",
        }),
      );
    edit();
    type("grafana:\n  replicas: 5");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(charts()).toBeUndefined();
    edit();
    expect(editor()).toHaveValue("grafana:\n  replicas: 2");
  });

  it("keeps a chart's values through a preset", () => {
    const charts = renderCharts({
      prometheusStack: {
        enabled: false,
        customValues: true,
        values: "grafana:\n  replicas: 2",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Monitoring stack" }));
    expect(charts().prometheusStack).toEqual({
      enabled: true,
      customValues: true,
      values: "grafana:\n  replicas: 2",
    });
    expect(charts().loki).toEqual({ enabled: true, customValues: false });
  });

  it("keeps a chart's values through Clear all and a switch off and on", () => {
    const values = "grafana:\n  replicas: 2";
    const charts = renderCharts({
      prometheusStack: { enabled: true, customValues: true, values },
    });
    const install = () =>
      screen.getByRole("switch", { name: "Install Prometheus Stack" });

    fireEvent.click(install());
    expect(charts().prometheusStack).toEqual({
      enabled: false,
      customValues: true,
      values,
    });
    expect(
      screen.queryByRole("button", {
        name: "Edit values for Prometheus Stack",
      }),
    ).toBeNull();
    fireEvent.click(install());
    expect(
      screen.getByRole("button", { name: "Edit values for Prometheus Stack" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(charts().prometheusStack).toEqual({
      enabled: false,
      customValues: true,
      values,
    });
  });

  // Charts without values: the preset and Clear all build exactly the entries
  // they built before custom values were kept.
  it("builds the same entries as before for charts without values", () => {
    const defaults = generateDefaultHelmChartsConfig("eks");
    const charts = renderCharts(defaults);
    fireEvent.click(screen.getByRole("button", { name: "Monitoring stack" }));
    expect(JSON.stringify(charts())).toBe(
      JSON.stringify({
        ...defaults,
        prometheusStack: { enabled: true, customValues: false },
        loki: { enabled: true, customValues: false },
        promtail: { enabled: true, customValues: false },
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(JSON.stringify(charts())).toBe(
      JSON.stringify(
        Object.fromEntries(
          Object.keys(defaults).map((key) => [
            key,
            { enabled: false, customValues: false },
          ]),
        ),
      ),
    );
  });
});
