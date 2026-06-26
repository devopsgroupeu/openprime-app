import { Package, CheckCircle, Clock } from "lucide-react";

const HelmChartsList = ({ environment }) => {
  const helmCharts = environment.services?.eks?.helmCharts || {};
  const enabledCharts = Object.entries(helmCharts).filter(
    ([_, config]) => config?.enabled,
  );
  const disabledCharts = Object.entries(helmCharts).filter(
    ([_, config]) => !config?.enabled,
  );

  const getStatusIcon = (enabled) => {
    if (enabled) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    return <Clock className="w-4 h-4 text-tertiary" />;
  };

  const HelmChartItem = ({ chartName, chartConfig }) => {
    return (
      <div className="p-4 rounded-lg border bg-surface border-border transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium capitalize text-primary">
                {chartName}
              </h4>
              <p className="text-sm text-secondary">
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
      <div className="text-center py-8 text-secondary">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Helm charts are available when EKS is enabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {enabledCharts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-primary">
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
          <h3 className="text-lg font-bold mb-4 text-secondary">
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
        <div className="text-center py-8 text-secondary">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No Helm charts configured for this environment</p>
        </div>
      )}
    </div>
  );
};

export default HelmChartsList;
