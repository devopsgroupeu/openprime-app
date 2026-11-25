import { getHelmChartConfig } from "../../config/helmChartsConfig";
import { chartLogo } from "../../config/logos";
import { LogoTile } from "@/components/shared/logo-tile";
import { SettingsSection } from "@/components/shared/settings";
import { Badge } from "@/components/ui/badge";

/**
 * Enabled charts `[key, config]` of the EKS cluster, as the wizard lists them.
 * Charts no longer in the catalog are left out (generation drops them and the
 * wizard prunes them), and so are the always installed ones (Argo CD,
 * Karpenter).
 */
export const enabledCharts = (environment) =>
  environment.services?.eks?.enabled
    ? Object.entries(environment.services.eks.helmCharts || {}).filter(
        ([key, config]) =>
          config?.enabled &&
          getHelmChartConfig(key) &&
          !getHelmChartConfig(key).implicit,
      )
    : [];

/** Helm charts tab: one divided card of the enabled charts. */
const HelmChartsList = ({ environment }) => (
  <SettingsSection
    title="Helm charts"
    description="Charts included in the generated Argo CD configuration."
  >
    <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset">
      {enabledCharts(environment).map(([key, config]) => {
        const chart = getHelmChartConfig(key);
        const version = config.version || chart.version;
        const namespace = config.namespace || chart.namespace;
        return (
          <li key={key} className="flex items-center gap-3 px-3.5 py-3">
            <LogoTile {...chartLogo(key)} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {chart.displayName}
              </span>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{`${chart.repository}/${chart.chart}`}</span>
                {namespace ? (
                  <>
                    <span
                      aria-hidden
                      className="mx-2 inline-block h-3 w-px translate-y-0.5 bg-border"
                    />
                    Namespace <span className="font-mono">{namespace}</span>
                  </>
                ) : null}
              </p>
            </div>
            {version ? (
              <Badge variant="outline" className="font-mono">
                {version}
              </Badge>
            ) : null}
          </li>
        );
      })}
    </ul>
  </SettingsSection>
);

export default HelmChartsList;
