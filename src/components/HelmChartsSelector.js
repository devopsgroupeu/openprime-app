// src/components/HelmChartsSelector.js
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Package } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HELM_CHARTS_INFO = {
  prometheus: {
    name: 'Prometheus',
    description: 'Monitoring and alerting toolkit',
    category: 'Monitoring'
  },
  grafana: {
    name: 'Grafana',
    description: 'Observability and data visualization platform',
    category: 'Monitoring'
  },
  argocd: {
    name: 'ArgoCD',
    description: 'GitOps continuous delivery tool',
    category: 'CI/CD'
  },
  loki: {
    name: 'Loki',
    description: 'Log aggregation system',
    category: 'Monitoring'
  },
  karpenter: {
    name: 'Karpenter',
    description: 'Node provisioning and lifecycle management',
    category: 'Infrastructure'
  },
  certManager: {
    name: 'Cert-Manager',
    description: 'Certificate management controller',
    category: 'Security'
  },
  externalDns: {
    name: 'External DNS',
    description: 'DNS record management for Kubernetes',
    category: 'Networking'
  },
  nginx: {
    name: 'NGINX Ingress',
    description: 'Ingress controller using NGINX',
    category: 'Networking'
  },
  istio: {
    name: 'Istio',
    description: 'Service mesh platform',
    category: 'Networking'
  },
  fluxcd: {
    name: 'FluxCD',
    description: 'GitOps toolkit for Kubernetes',
    category: 'CI/CD'
  },
  velero: {
    name: 'Velero',
    description: 'Backup and disaster recovery',
    category: 'Infrastructure'
  },
  falco: {
    name: 'Falco',
    description: 'Runtime security monitoring',
    category: 'Security'
  },
  trivyOperator: {
    name: 'Trivy Operator',
    description: 'Vulnerability scanning operator',
    category: 'Security'
  }
};

const HelmChartsSelector = ({ value = {}, onChange, onEditHelmValues }) => {
  const { isDark } = useTheme();
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleChartToggle = (chartKey, enabled) => {
    const newValue = {
      ...value,
      [chartKey]: {
        ...value[chartKey],
        enabled
      }
    };
    onChange(newValue);
  };

  const handleCustomValuesToggle = (chartKey, customValues) => {
    const newValue = {
      ...value,
      [chartKey]: {
        ...value[chartKey],
        customValues
      }
    };
    onChange(newValue);
  };

  // Group charts by category
  const chartsByCategory = Object.entries(HELM_CHARTS_INFO).reduce((acc, [key, info]) => {
    if (!acc[info.category]) acc[info.category] = [];
    acc[info.category].push({ key, ...info });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        isDark
          ? 'bg-gray-700/30 border-gray-600'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center">
          <Package className="w-5 h-5 mr-2 text-teal-500" />
          <span className={`font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Helm Charts Configuration
          </span>
        </div>
        <div className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {Object.values(value).filter(chart => chart?.enabled).length} selected
        </div>
      </div>

      {Object.entries(chartsByCategory).map(([category, charts]) => (
        <div key={category} className={`border rounded-lg ${
          isDark
            ? 'border-gray-600 bg-gray-800/30'
            : 'border-gray-200 bg-white/50'
        }`}>
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => toggleCategory(category)}
          >
            <div className="flex items-center">
              {expandedCategories[category] ? (
                <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
              )}
              <span className={`font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {category}
              </span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              isDark
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {charts.filter(chart => value[chart.key]?.enabled).length} / {charts.length}
            </span>
          </div>

          {expandedCategories[category] && (
            <div className={`border-t p-3 space-y-3 ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            }`}>
              {charts.map((chart) => {
                const chartConfig = value[chart.key] || { enabled: false, customValues: false };
                return (
                  <div key={chart.key} className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDark
                      ? 'border-gray-600 bg-gray-700/20'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={chartConfig.enabled}
                          onChange={(e) => handleChartToggle(chart.key, e.target.checked)}
                        />
                        <div className={`w-11 h-6 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                      </label>
                      <div>
                        <div className={`font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {chart.name}
                        </div>
                        <div className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {chart.description}
                        </div>
                      </div>
                    </div>

                    {chartConfig.enabled && (
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={chartConfig.customValues}
                            onChange={(e) => handleCustomValuesToggle(chart.key, e.target.checked)}
                          />
                          <div className={`w-9 h-5 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${
                            isDark ? 'bg-gray-600' : 'bg-gray-300'
                          }`}></div>
                        </label>
                        <span className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Custom Values
                        </span>
                        {chartConfig.customValues && onEditHelmValues && (
                          <button
                            onClick={() => onEditHelmValues(chart.key)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Edit custom values"
                          >
                            <Settings className="w-4 h-4 text-teal-500" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HelmChartsSelector;
