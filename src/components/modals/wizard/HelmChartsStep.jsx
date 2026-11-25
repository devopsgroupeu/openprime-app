// src/components/modals/wizard/HelmChartsStep.js
// Wizard step 3 (only with a Kubernetes service): where the charts go, the
// default-values note, starting presets and the charts by category.
import { Package } from "lucide-react";
import HelmChartsSelector from "../../HelmChartsSelector";
import { getHelmChartsForK8sService } from "../../../config/helmChartsConfig";
import { rebuiltChart } from "../../../utils/helmValues";
import StarterTemplates from "./StarterTemplates";
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

  // Only the charts with a switch here: Argo CD and Karpenter are always
  // installed and not listed.
  const getEnabledChartsCount = () => {
    const charts = newEnv.services[k8sService.name]?.helmCharts;
    if (!charts) return 0;
    return getHelmChartsForK8sService(k8sService.name).filter(
      (key) => charts[key]?.enabled,
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
  // Presets and Clear all rebuild entries; a chart's custom values stay.
  const rebuilt = (keys, enabled) =>
    Object.fromEntries(
      keys.map((key) => [key, rebuiltChart(currentCharts[key], enabled)]),
    );

  // A preset turns on only the charts this Kubernetes service has.
  const available = new Set(getHelmChartsForK8sService(k8sService.name));
  const presets = [
    {
      label: "Monitoring stack",
      description: "Metrics in Prometheus, logs in Loki through Promtail.",
      charts: ["prometheusStack", "loki", "promtail"],
    },
    {
      label: "Ingress stack",
      description: "NGINX ingress with TLS certificates and DNS records.",
      // ingress-nginx exposes a Service of type LoadBalancer. On EKS
      // nothing provisions one unless the AWS Load Balancer Controller is
      // running, so ArgoCD blocks on that Service's health and never
      // applies the Deployment - the customer gets an app stuck with no
      // pods and nothing explaining why (OP-234). Ship the controller with
      // the stack; it is EKS-only, and the stack is offered for AKS/GKE too.
      charts: [
        "ingressNginx",
        "certManager",
        "externalDns",
        "awsLoadBalancerController",
      ],
    },
  ];

  const clearCharts = () => {
    handleHelmChartsChange(rebuilt(Object.keys(currentCharts), false));
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
          Charts are generated with their default values. Custom values are
          saved with the environment but not applied yet.
        </Callout>
      </div>

      {enabledCount === 0 ? (
        <StarterTemplates
          kind="charts"
          cluster={k8sService.name}
          templates={presets.map((preset) => {
            const charts = preset.charts.filter((key) => available.has(key));
            return {
              label: preset.label,
              description: preset.description,
              items: charts,
              onApply: () => {
                handleHelmChartsChange({
                  ...currentCharts,
                  ...rebuilt(charts, true),
                });
                // The presets go away once a chart is selected.
                focusHeading?.();
              },
            };
          })}
        />
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
