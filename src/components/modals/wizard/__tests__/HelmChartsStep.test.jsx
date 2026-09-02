import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import HelmChartsStep from "../HelmChartsStep";

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
  fireEvent.click(screen.getByText("Ingress Stack"));
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
    fireEvent.click(screen.getByText("Ingress Stack"));
    expect(latest.services.eks.helmCharts.prometheusStack).toEqual({
      enabled: false,
      customValues: true,
    });
  });
});
