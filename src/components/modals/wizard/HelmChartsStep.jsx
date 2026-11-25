// src/components/modals/wizard/HelmChartsStep.js
// Wizard step 3 (only with a Kubernetes service): where the charts go, the
// default-values note, starting presets and the charts by category.
import { Package } from "lucide-react";
import HelmChartsSelector from "../../HelmChartsSelector";
import { getHelmChartsForK8sService } from "../../../config/helmChartsConfig";
import { Callout } from "@/components/shared/callout";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

const HelmChartsStep = ({ newEnv, setNewEnv, focusHeading }) => {
  // Get the enabled Kubernetes service
  const getEnabledK8sService = () => {
    if (newEnv.services?.eks?.enabled)
      return { name: "eks", displayName: "Amazon EKS", provider: "AWS" };
    if (newEnv.services?.aks?.enabled)
      return { name: "aks", displayName: "Azure AKS", provider: "Azure" };
    if (newEnv.services?.gke?.enabled)
      return {
        name: "gke",
        displayName: "Google GKE",
        provider: "Google Cloud",
      };
    if (newEnv.services?.kubernetes?.enabled)
      return {
        name: "kubernetes",
        displayName: "Kubernetes",
        provider: "On-Premise",
      };
    return null;
  };

  const k8sService = getEnabledK8sService();

  const getEnabledChartsCount = () => {
    if (!k8sService || !newEnv.services[k8sService.name]?.helmCharts) return 0;
    return Object.values(newEnv.services[k8sService.name].helmCharts).filter(
      (chart) => chart?.enabled,
    ).length;
  };

  const handleHelmChartsChange = (newHelmCharts) => {
    if (!k8sService) return;

    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [k8sService.name]: {
          ...newEnv.services[k8sService.name],
          helmCharts: newHelmCharts,
        },
      },
    });
  };

  if (!k8sService) {
    return (
      <EmptyState
        icon={Package}
        title="No Kubernetes service enabled"
        description="Helm charts install on a Kubernetes cluster. Enable Amazon EKS in Services to choose them."
      />
    );
  }

  const currentCharts = newEnv.services[k8sService.name]?.helmCharts || {};
  const enabledCount = getEnabledChartsCount();

  const presets = [
    {
      label: "Monitoring stack",
      apply: () =>
        handleHelmChartsChange({
          ...currentCharts,
          prometheusStack: { enabled: true, customValues: false },
          loki: { enabled: true, customValues: false },
          promtail: { enabled: true, customValues: false },
        }),
    },
    {
      label: "GitOps setup",
      apply: () =>
        handleHelmChartsChange({
          ...currentCharts,
          argocd: { enabled: true, customValues: false },
        }),
    },
    {
      label: "Ingress stack",
      apply: () => {
        // ingress-nginx exposes a Service of type LoadBalancer. On EKS
        // nothing provisions one unless the AWS Load Balancer
        // Controller is running, so ArgoCD blocks on that Service's
        // health and never applies the Deployment - the customer gets
        // an app stuck with no pods and nothing explaining why
        // (OP-234). Ship the controller with the stack, filtered to
        // the charts this Kubernetes service actually has: it is
        // EKS-only, and the stack is offered for AKS/GKE too.
        const available = new Set(getHelmChartsForK8sService(k8sService.name));
        const stack = [
          "ingressNginx",
          "certManager",
          "externalDns",
          "awsLoadBalancerController",
        ];
        handleHelmChartsChange({
          ...currentCharts,
          ...Object.fromEntries(
            stack
              .filter((chart) => available.has(chart))
              .map((chart) => [chart, { enabled: true, customValues: false }]),
          ),
        });
      },
    },
  ];

  const clearCharts = () => {
    const clearedCharts = {};
    Object.keys(currentCharts).forEach((key) => {
      clearedCharts[key] = {
        enabled: false,
        customValues: false,
      };
    });
    handleHelmChartsChange(clearedCharts);
    // Clear all goes away with the last chart.
    focusHeading?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-sm">
            Deploys to {k8sService.displayName}
            {newEnv.name ? (
              <>
                {" "}
                in <span className="font-mono text-xs">{newEnv.name}</span>
              </>
            ) : null}
            . Argo CD and Karpenter are always installed.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <p
              aria-live="polite"
              className="text-sm text-muted-foreground tabular-nums"
            >
              {enabledCount} selected
            </p>
            {enabledCount > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearCharts}>
                Clear all
              </Button>
            ) : null}
          </div>
        </div>
        <Callout variant="info">
          Charts are generated with their default values.
        </Callout>
      </div>

      {enabledCount === 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Start with</p>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="secondary"
              size="sm"
              onClick={() => {
                preset.apply();
                // The presets go away once a chart is selected.
                focusHeading?.();
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}

      <HelmChartsSelector
        value={currentCharts}
        onChange={handleHelmChartsChange}
        k8sServiceName={k8sService.name}
      />
    </div>
  );
};

export default HelmChartsStep;
