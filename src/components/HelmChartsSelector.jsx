// src/components/HelmChartsSelector.js
import { useState } from "react";
import { ChevronDown, ChevronRight, Settings, Package } from "lucide-react";
import { getHelmChartsByCategory } from "../config/helmChartsConfig";

const HelmChartsSelector = ({
  value = {},
  onChange,
  onEditHelmValues,
  k8sServiceName,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleChartToggle = (chartKey, enabled) => {
    const newValue = {
      ...value,
      [chartKey]: {
        ...value[chartKey],
        enabled,
      },
    };
    onChange(newValue);
  };

  // Get charts available for this k8s service, grouped by category
  const chartsByCategory = k8sServiceName
    ? getHelmChartsByCategory(k8sServiceName)
    : {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg border bg-background border-border">
        <div className="flex items-center">
          <Package className="w-5 h-5 mr-2 text-accent" />
          <span className="font-semibold text-primary">
            Helm Charts Configuration
          </span>
        </div>
        <div className="section-label">
          {Object.values(value).filter((chart) => chart?.enabled).length}{" "}
          selected
        </div>
      </div>

      {Object.entries(chartsByCategory).map(([category, charts]) => (
        <div
          key={category}
          className="border rounded-lg border-border bg-surface"
        >
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => toggleCategory(category)}
          >
            <div className="flex items-center">
              {expandedCategories[category] ? (
                <ChevronDown className="w-4 h-4 mr-2 text-tertiary" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 text-tertiary" />
              )}
              <span className="section-label">{category}</span>
            </div>
            <span className="text-sm px-2 py-1 rounded-full bg-background border border-border text-secondary">
              {charts.filter((chart) => value[chart.key]?.enabled).length} /{" "}
              {charts.length}
            </span>
          </div>

          {expandedCategories[category] && (
            <div className="border-t p-3 space-y-3 border-border">
              {charts.map((chart) => {
                const chartConfig = value[chart.key] || {
                  enabled: false,
                  customValues: false,
                };
                const isChartAvailable = chart.enabled !== false;
                return (
                  <div
                    key={chart.key}
                    className={`flex items-center justify-between p-3 rounded-lg border border-border bg-background ${
                      isChartAvailable ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <label
                        className={`relative inline-flex items-center ${isChartAvailable ? "cursor-pointer" : "cursor-not-allowed"}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={chartConfig.enabled}
                          disabled={!isChartAvailable}
                          onChange={(e) =>
                            handleChartToggle(chart.key, e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow after:rounded-full after:h-5 after:w-5 after:transition-all bg-border-strong"></div>
                      </label>
                      <div>
                        <div
                          className={`font-medium ${
                            isChartAvailable ? "text-primary" : "text-tertiary"
                          }`}
                        >
                          {chart.displayName}
                          {!isChartAvailable && (
                            <span className="ml-2 text-xs font-medium text-warning">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-sm ${
                            isChartAvailable
                              ? "text-secondary"
                              : "text-tertiary"
                          }`}
                        >
                          {chart.description}
                        </div>
                      </div>
                    </div>

                    {chartConfig.enabled &&
                      onEditHelmValues &&
                      isChartAvailable && (
                        <button
                          onClick={() => onEditHelmValues(chart.key)}
                          className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                          title="Configure chart values"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
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
