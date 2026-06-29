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
      <div className="rounded-2xl border bg-surface border-border p-6 transition-all hover:shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="p-3 rounded-lg bg-primary-muted border border-primary shrink-0">
              <Package className="w-6 h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-primary truncate">
                {chartName}
              </h4>
              <p className="text-sm text-secondary truncate">
                {chartConfig?.namespace
                  ? `Namespace: ${chartConfig.namespace}`
                  : chartConfig?.customValues
                    ? "Custom values configured"
                    : "Default configuration"}
              </p>
            </div>
          </div>
          {chartConfig?.version ? (
            <span className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-tertiary">
              v{chartConfig.version}
            </span>
          ) : (
            getStatusIcon(chartConfig?.enabled)
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {enabledCharts.map(([chartName, chartConfig]) => (
            <HelmChartItem
              key={chartName}
              chartName={chartName}
              chartConfig={chartConfig}
            />
          ))}
        </div>
      )}

      {disabledCharts.length > 0 && (
        <div>
          <h3 className="text-2xl font-extrabold mb-4 text-secondary">
            Available Charts ({disabledCharts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
