// src/components/modals/wizard/HelmChartsStep.js
import React from "react";
import { Package, Zap, Info } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import HelmChartsSelector from "../../HelmChartsSelector";

const HelmChartsStep = ({ newEnv, setNewEnv, onEditHelmValues }) => {
  const { isDark } = useTheme();

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
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3
          className={`text-lg font-medium mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          No Kubernetes Service Enabled
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
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
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 ${
            isDark
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "bg-teal-500/10 text-teal-700 border border-teal-500/30"
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Helm Charts Configuration
        </div>
        <h3
          className={`text-xl font-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Configure Kubernetes Applications
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Select Helm charts to deploy on your {k8sService.displayName} cluster
        </p>
      </div>

      {/* K8s Service Summary */}
      <div
        className={`p-4 rounded-lg border ${
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Kubernetes Service: {k8sService.displayName}
            </span>
            <span
              className={`ml-4 text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {k8sService.provider} • {newEnv.name}
            </span>
          </div>
          <div
            className={`text-sm px-3 py-1 rounded-full ${
              getEnabledChartsCount() > 0
                ? isDark
                  ? "bg-teal-500/20 text-teal-300"
                  : "bg-teal-100 text-teal-700"
                : isDark
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {getEnabledChartsCount()} charts selected
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        className={`p-4 rounded-lg border ${
          isDark
            ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
            : "bg-blue-50 border-blue-200 text-blue-700"
        }`}
      >
        <div className="flex items-start">
          <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Helm Charts Information:</p>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
              <li>
                Charts are organized by category: Monitoring, Security,
                Networking, etc.
              </li>
              <li>
                Enable "Custom Values" to modify default chart configurations
              </li>
              <li>
                All charts are optional - you can add them later if needed
              </li>
              <li>
                Popular combinations: Prometheus + Grafana for monitoring,
                ArgoCD for GitOps
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Enable Suggestions */}
      {getEnabledChartsCount() === 0 && (
        <div
          className={`p-4 rounded-lg border ${
            isDark
              ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h4
              className={`text-sm font-medium mb-2 ${
                isDark ? "text-yellow-300" : "text-yellow-700"
              }`}
            >
              Quick Start Templates
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    prometheus: { enabled: true, customValues: false },
                    grafana: { enabled: true, customValues: false },
                  });
                }}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isDark
                    ? "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
                    : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                }`}
              >
                Monitoring Stack
              </button>
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    argocd: { enabled: true, customValues: false },
                    certManager: { enabled: true, customValues: false },
                  });
                }}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isDark
                    ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                GitOps Setup
              </button>
              <button
                onClick={() => {
                  const currentCharts =
                    newEnv.services[k8sService.name]?.helmCharts || {};
                  handleHelmChartsChange({
                    ...currentCharts,
                    nginx: { enabled: true, customValues: false },
                    certManager: { enabled: true, customValues: false },
                    externalDns: { enabled: true, customValues: false },
                  });
                }}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  isDark
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
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
        <div
          className={`p-4 rounded-lg border ${
            isDark
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
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
                clearedCharts[key] = { enabled: false, customValues: false };
              });
              handleHelmChartsChange(clearedCharts);
            }}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? "text-orange-400 hover:bg-orange-500/20"
                : "text-orange-600 hover:bg-orange-100"
            }`}
          >
            Clear All Charts
          </button>
        </div>
      )}
    </div>
  );
};

export default HelmChartsStep;
