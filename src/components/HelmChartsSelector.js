// src/components/HelmChartsSelector.js
import React, { useState } from "react";
import { ChevronDown, ChevronRight, Settings, Package } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { getHelmChartsByCategory } from "../config/helmChartsConfig";

const HelmChartsSelector = ({ value = {}, onChange, onEditHelmValues, k8sServiceName }) => {
  const { isDark } = useTheme();
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
  const chartsByCategory = k8sServiceName ? getHelmChartsByCategory(k8sServiceName) : {};

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${
          isDark ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center">
          <Package className="w-5 h-5 mr-2 text-teal-500" />
          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
            Helm Charts Configuration
          </span>
        </div>
        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {Object.values(value).filter((chart) => chart?.enabled).length} selected
        </div>
      </div>

      {Object.entries(chartsByCategory).map(([category, charts]) => (
        <div
          key={category}
          className={`border rounded-lg ${
            isDark ? "border-gray-600 bg-gray-800/30" : "border-gray-200 bg-white/50"
          }`}
        >
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
              <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {category}
              </span>
            </div>
            <span
              className={`text-sm px-2 py-1 rounded-full ${
                isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
              }`}
            >
              {charts.filter((chart) => value[chart.key]?.enabled).length} / {charts.length}
            </span>
          </div>

          {expandedCategories[category] && (
            <div
              className={`border-t p-3 space-y-3 ${isDark ? "border-gray-600" : "border-gray-200"}`}
            >
              {charts.map((chart) => {
                const chartConfig = value[chart.key] || {
                  enabled: false,
                  customValues: false,
                };
                return (
                  <div
                    key={chart.key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isDark ? "border-gray-600 bg-gray-700/20" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={chartConfig.enabled}
                          onChange={(e) => handleChartToggle(chart.key, e.target.checked)}
                        />
                        <div
                          className={`w-11 h-6 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            isDark ? "bg-gray-600" : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                      <div>
                        <div className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {chart.displayName}
                        </div>
                        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {chart.description}
                        </div>
                      </div>
                    </div>

                    {chartConfig.enabled && onEditHelmValues && (
                      <button
                        onClick={() => onEditHelmValues(chart.key)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? "hover:bg-gray-600 text-gray-400 hover:text-white"
                            : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                        }`}
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
