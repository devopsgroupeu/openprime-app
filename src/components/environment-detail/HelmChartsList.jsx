import { ChevronRight, FileCode } from "lucide-react";
import { getHelmChartConfig } from "../../config/helmChartsConfig";
import { chartLogo } from "../../config/logos";
import { chartValues } from "../../utils/helmValues";
import { CodeBlock } from "@/components/shared/code-block";
import { LogoTile } from "@/components/shared/logo-tile";
import { SettingsSection } from "@/components/shared/settings";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const ROW = "flex w-full items-center gap-3 px-3.5 py-3 text-left";

// Logo, name, chart id, namespace, the custom values mark and the version.
function ChartSummary({ chartKey, config, hasValues }) {
  const chart = getHelmChartConfig(chartKey);
  const version = config.version || chart.version;
  const namespace = config.namespace || chart.namespace;
  return (
    <>
      <LogoTile {...chartLogo(chartKey)} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* The mark wraps under a name it would cut short. */}
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium">
            {chart.displayName}
          </span>
          {hasValues ? (
            <Badge variant="info">
              <FileCode aria-hidden />
              Custom values
            </Badge>
          ) : null}
        </span>
        <span className="truncate text-xs text-muted-foreground">
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
        </span>
      </span>
      {version ? (
        <Badge variant="tag" className="font-mono">
          {version}
        </Badge>
      ) : null}
    </>
  );
}

// A chart with custom values opens them read-only, like a service row opens
// its configuration.
function ChartRow({ chartKey, config }) {
  const values = chartValues(config);
  if (!values) {
    return (
      <li className={ROW}>
        <ChartSummary chartKey={chartKey} config={config} />
      </li>
    );
  }
  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger
          className={`group ${ROW} outline-none transition-[background-color] duration-(--dur-fast) hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
        >
          <ChartSummary chartKey={chartKey} config={config} hasValues />
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--dur-fast) group-data-[state=open]:rotate-90"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-2 border-t border-border bg-muted/30 px-3.5 py-3 sm:pl-15.5">
          <CodeBlock
            lang="yaml"
            code={values}
            copyLabel="Copy values"
            className="my-0"
          />
          <p className="text-xs text-muted-foreground">
            Saved with the environment. Generated repositories do not apply
            custom values yet.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/** Helm charts tab: one divided card of the enabled charts. */
const HelmChartsList = ({ environment }) => (
  <SettingsSection
    title="Helm charts"
    description="Charts included in the generated Argo CD configuration."
  >
    <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset">
      {enabledCharts(environment).map(([key, config]) => (
        <ChartRow key={key} chartKey={key} config={config} />
      ))}
    </ul>
  </SettingsSection>
);

export default HelmChartsList;
