// src/components/modals/wizard/HelmChartsStep.js
import { Package, Zap, Info, Sparkles } from "lucide-react";
import HelmChartsSelector from "../../HelmChartsSelector";

const HelmChartsStep = ({ newEnv, setNewEnv, onEditHelmValues }) => {
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
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-tertiary" />
        <h3 className="text-lg font-medium mb-2 text-primary">
          No Kubernetes Service Enabled
        </h3>
        <p className="text-sm text-secondary">
          This step is only available when a Kubernetes service (EKS, AKS, GKE,
          or Kubernetes) is enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 bg-primary-muted text-primary border border-primary">
          <Package className="w-4 h-4 mr-2" />
          Helm Charts Configuration
        </div>
        <h3 className="text-xl font-bold mb-2 text-primary">
          Configure Kubernetes Applications
        </h3>
        <p className="text-sm text-secondary">
          Select Helm charts to deploy on your {k8sService.displayName} cluster
        </p>
      </div>

      {/* K8s Service Summary */}
      <div className="p-4 rounded-lg border bg-surface border-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-secondary">
              Kubernetes Service: {k8sService.displayName}
            </span>
            <span className="ml-4 text-sm text-secondary">
              {k8sService.provider} • {newEnv.name}
            </span>
          </div>
          <div
            className={`text-sm px-3 py-1 rounded-full ${
              getEnabledChartsCount() > 0
                ? "bg-primary-muted text-primary"
                : "bg-background-secondary text-tertiary"
            }`}
          >
            {getEnabledChartsCount()} charts selected
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
        <div className="flex items-start">
          <Sparkles className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-medium mb-1">Preview</p>
            <p className="text-xs opacity-80">
              Helm chart configurations are currently in preview. Full
              functionality is actively being developed and will be available in
              an upcoming release.
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
        <div className="flex items-start">
          <Info className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Helm Charts Information:</p>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
              <li>
                Charts are organized by category: Monitoring, Security,
                Networking, etc.
              </li>
              <li>
                Enable &quot;Custom Values&quot; to modify default chart
                configurations
              </li>
              <li>
                All charts are optional - you can add them later if needed
              </li>
              <li>
                Karpenter and ArgoCD are enabled automatically for all
                Kubernetes clusters
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Enable Suggestions */}
      {getEnabledChartsCount() === 0 && (
        <div className="p-4 rounded-lg border bg-warning-muted border-warning">
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-warning" />
            <h4 className="section-label mb-2 text-warning">
              Quick Start Templates
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    prometheus: {
                      enabled: true,
                      customValues: false,
                    },
                    grafana: {
                      enabled: true,
                      customValues: false,
                    },
                  });
                }}
                className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
              >
                Monitoring Stack
              </button>
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    certManager: {
                      enabled: true,
                      customValues: false,
                    },
                  });
                }}
                className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
              >
                GitOps Setup
              </button>
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    nginx: {
                      enabled: true,
                      customValues: false,
                    },
                    certManager: {
                      enabled: true,
                      customValues: false,
                    },
                    externalDns: {
                      enabled: true,
                      customValues: false,
                    },
                  });
                }}
                className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
              >
                Ingress Stack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helm Charts Selector */}
      <div>
        <HelmChartsSelector
          value={newEnv.services[k8sService.name]?.helmCharts || {}}
          onChange={handleHelmChartsChange}
          onEditHelmValues={onEditHelmValues}
          k8sServiceName={k8sService.name}
        />
      </div>

      {/* Summary */}
      {getEnabledChartsCount() > 0 && (
        <div className="p-4 rounded-lg border bg-success-muted border-success text-success">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
            <span className="text-sm font-medium">
              {getEnabledChartsCount()} Helm chart
              {getEnabledChartsCount() !== 1 ? "s" : ""} will be deployed to
              your {k8sService.displayName} cluster
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {getEnabledChartsCount() > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              const currentCharts =
                newEnv.services[k8sService.name]?.helmCharts || {};
              const clearedCharts = {};
              Object.keys(currentCharts).forEach((key) => {
                clearedCharts[key] = {
                  enabled: false,
                  customValues: false,
                };
              });
              handleHelmChartsChange(clearedCharts);
            }}
            className="text-sm px-4 py-2 rounded-lg transition-colors text-warning hover:bg-warning-muted"
          >
            Clear All Charts
          </button>
        </div>
      )}
    </div>
  );
};

export default HelmChartsStep;
