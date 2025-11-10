import React from "react";
import { Package, CheckCircle, Clock } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const HelmChartsList = ({ environment }) => {
  const { isDark } = useTheme();

  const helmCharts = environment.services?.eks?.helmCharts || {};
  const enabledCharts = Object.entries(helmCharts).filter(
    ([_, config]) => config?.enabled,
  );
  const disabledCharts = Object.entries(helmCharts).filter(
    ([_, config]) => !config?.enabled,
  );

  const getStatusIcon = (enabled) => {
    if (enabled) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const HelmChartItem = ({ chartName, chartConfig }) => {
    return (
      <div
        className={`p-4 rounded-lg border transition-colors ${
          isDark
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5 text-teal-500" />
            <div>
              <h4
                className={`font-medium capitalize ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {chartName}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {chartConfig?.customValues
                  ? "Custom values configured"
                  : "Default configuration"}
              </p>
            </div>
          </div>
          {getStatusIcon(chartConfig?.enabled)}
        </div>
      </div>
    );
  };

  if (!environment.services?.eks?.enabled) {
    return (
      <div
        className={`text-center py-8 ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Helm charts are available when EKS is enabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {enabledCharts.length > 0 && (
        <div>
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Installed Charts ({enabledCharts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledCharts.map(([chartName, chartConfig]) => (
              <HelmChartItem
                key={chartName}
                chartName={chartName}
                chartConfig={chartConfig}
              />
            ))}
          </div>
        </div>
      )}

      {disabledCharts.length > 0 && (
        <div>
          <h3
            className={`text-lg font-semibold mb-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Available Charts ({disabledCharts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {disabledCharts.map(([chartName, chartConfig]) => (
              <HelmChartItem
                key={chartName}
                chartName={chartName}
                chartConfig={chartConfig}
              />
            ))}
          </div>
        </div>
      )}

      {Object.keys(helmCharts).length === 0 && (
        <div
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No Helm charts configured for this environment</p>
        </div>
      )}
    </div>
  );
};

export default HelmChartsList;
