// src/components/HelmChartsSelector.js
// Helm charts by category: one collapsible card per category, open while it
// holds a selected chart, chart rows with a switch and, once on, their custom
// values.
import { useState } from "react";
import { ChevronRight, FileCode, Pencil } from "lucide-react";
import { getHelmChartsByCategory } from "../config/helmChartsConfig";
import { chartLogo, chartLogos } from "../config/logos";
import { chartValues, withValues } from "../utils/helmValues";
import HelmValuesDialog from "./modals/wizard/HelmValuesDialog";
import { LogoTile } from "@/components/shared/logo-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn, TOUCH_HIT } from "@/lib/utils";

const HelmChartsSelector = ({ value = {}, onChange, k8sServiceName }) => {
  // A category the user opened or closed keeps that state; the others are
  // open exactly while they hold a selected chart.
  const [openCategories, setOpenCategories] = useState({});
  // The chart whose values are open; the key stays while the dialog closes.
  const [editing, setEditing] = useState({ key: null, open: false });

  const setCategoryOpen = (category, open) =>
    setOpenCategories((prev) => ({ ...prev, [category]: open }));

  // Off keeps a chart's values: they are back when it is on again.
  const handleChartToggle = (chartKey, enabled, category) => {
    // Turning off the last chart must not fold the category away.
    setCategoryOpen(category, true);
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
    <div className="flex flex-col gap-3">
      {Object.entries(chartsByCategory).map(([category, charts]) => {
        const selected = charts.filter(
          (chart) => value[chart.key]?.enabled,
        ).length;
        const open = openCategories[category] ?? selected > 0;
        return (
          <Collapsible
            key={category}
            open={open}
            onOpenChange={(next) => setCategoryOpen(category, next)}
            className="overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset"
          >
            <h2>
              <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3.5 py-3 text-left outline-none transition-[background-color] duration-(--dur-fast) hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                <span className="flex-1 text-md font-medium">{category}</span>
                {/* Closed, it shows which charts are inside. */}
                <span
                  data-slot="chart-logos"
                  className="flex gap-1 group-data-[state=open]:hidden"
                >
                  {chartLogos(charts.map((chart) => chart.key)).map(
                    (tile, i) => (
                      <LogoTile key={tile.logo ?? i} {...tile} size="sm" />
                    ),
                  )}
                </span>
                <Badge
                  variant={selected > 0 ? "success" : "neutral"}
                  className="tabular-nums"
                >
                  {selected} of {charts.length}
                </Badge>
                <ChevronRight
                  aria-hidden
                  className="size-4 text-muted-foreground transition-transform duration-(--dur-fast) group-data-[state=open]:rotate-90"
                />
              </CollapsibleTrigger>
            </h2>

            <CollapsibleContent>
              <ul className="divide-y divide-border border-t border-border">
                {charts.map((chart) => {
                  const isChartAvailable = chart.enabled !== false;
                  const enabled = Boolean(value[chart.key]?.enabled);
                  const hasValues = enabled && chartValues(value[chart.key]);
                  return (
                    <li
                      key={chart.key}
                      className="flex items-center gap-3 px-3.5 py-3"
                    >
                      <LogoTile
                        {...chartLogo(chart.key)}
                        className={cn(!isChartAvailable && "opacity-50")}
                      />
                      <div
                        className={cn(
                          "flex min-w-0 flex-1 flex-col gap-0.5",
                          !isChartAvailable && "opacity-50",
                        )}
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-sm font-medium">
                            {chart.displayName}
                          </h3>
                          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                            {chart.chart}
                          </span>
                          <Badge variant="tag" className="font-mono">
                            {chart.version}
                          </Badge>
                          {!isChartAvailable && (
                            <Badge variant="neutral">Unavailable</Badge>
                          )}
                          {hasValues ? (
                            <Badge variant="info">
                              <FileCode aria-hidden />
                              Custom values
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {chart.description}
                        </p>
                        {enabled ? (
                          // One button for both labels: focus comes back to
                          // it after the dialog, whatever it says then.
                          <Button
                            variant="ghost"
                            size="xs"
                            aria-label={`${hasValues ? "Edit values" : "Add custom values"} for ${chart.displayName}`}
                            onClick={() =>
                              setEditing({ key: chart.key, open: true })
                            }
                            className={cn(
                              "mt-1 -ml-1.5 self-start max-md:min-h-6",
                              TOUCH_HIT,
                            )}
                          >
                            {hasValues ? (
                              <Pencil aria-hidden />
                            ) : (
                              <FileCode aria-hidden />
                            )}
                            {hasValues ? "Edit values" : "Add custom values"}
                          </Button>
                        ) : null}
                      </div>

                      <Switch
                        checked={enabled}
                        disabled={!isChartAvailable}
                        onCheckedChange={(checked) =>
                          handleChartToggle(chart.key, checked, category)
                        }
                        aria-label={`Install ${chart.displayName}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      <HelmValuesDialog
        chartKey={editing.key}
        open={editing.open}
        onOpenChange={(open) => setEditing((prev) => ({ ...prev, open }))}
        values={chartValues(value[editing.key])}
        onSave={(text) =>
          onChange({
            ...value,
            [editing.key]: withValues(value[editing.key], text),
          })
        }
      />
    </div>
  );
};

export default HelmChartsSelector;
