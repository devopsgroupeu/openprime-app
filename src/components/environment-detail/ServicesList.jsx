import { useState } from "react";
import { Link } from "react-router";
import {
  Box,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
} from "lucide-react";
import { FIELD_TYPES, getServiceConfig } from "../../config/servicesConfig";
import ServiceIcon from "../icons/ServiceIcon";
import { SettingsSection } from "@/components/shared/settings";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// The parameters (catalog keys) a service's one-line summary names; other
// services name their first set parameters.
const SUMMARY_KEYS = {
  vpc: ["cidr", "azCount"],
  eks: [
    "kubernetesVersion",
    "defaultNodeGroupInstanceTypes",
    "defaultNodeGroupDesiredSize",
  ],
  rds: ["engine", "instanceClass", "allocatedStorage"],
  aurora: ["engine", "engineVersion", "serverlessv2MaxCapacity"],
  opensearch: ["version", "instanceType", "instanceCount"],
  elasticache: ["engine", "nodeType", "numCacheNodes"],
  msk: ["kafkaVersion", "brokerNodeInstanceType", "numberOfBrokerNodes"],
};

const humanizeKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fieldLabel = (definition, key) =>
  definition?.fields?.[key]?.displayName || humanizeKey(key);

const formatValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/** Enabled services `[key, config]`, A to Z. */
export const enabledServiceEntries = (environment) =>
  Object.entries(environment.services || {})
    .filter(([, config]) => config?.enabled)
    .sort(([a], [b]) => a.localeCompare(b));

const configEntries = (config) =>
  Object.entries(config).filter(
    ([key]) => key !== "enabled" && key !== "helmCharts",
  );

// "PostgreSQL - Open-source" and "3 AZs (Recommended)" read as their start.
const shortLabel = (label) =>
  String(label)
    .split(" - ")[0]
    .replace(/\s*\(.*\)$/, "");

// "Storage (GB)" reads "100 GB", "Retention (seconds)" "1 second" or, in
// whole hours or days, "4 days", "Instance Count" "2 instances", "Number of
// Cache Nodes" "1 cache node".
const withUnit = (value, label) => {
  let unit = /\(([^)]+)\)$/.exec(label)?.[1];
  if (unit === "seconds" && value >= 3600 && value % 3600 === 0) {
    [value, unit] =
      value % 86400 === 0 ? [value / 86400, "days"] : [value / 3600, "hours"];
  }
  if (unit) {
    return value === 1 && /^[a-z]+s$/.test(unit)
      ? `1 ${unit.slice(0, -1)}`
      : `${value} ${unit}`;
  }
  const noun = label
    .replace(/^Number of /i, "")
    .replace(/ Count$/i, "")
    .toLowerCase();
  if (value === 1) return `1 ${noun.replace(/s$/, "")}`;
  return `${value} ${noun.endsWith("s") ? noun : `${noun}s`}`;
};

const versioned = (key, text) =>
  /version$/i.test(key) && /^\d/.test(text) ? `v${text}` : text;

// One value as the summary says it; switches, objects and empty values say
// nothing.
const summaryPart = (key, value, definition) => {
  const field = definition?.fields?.[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean" || field?.type === FIELD_TYPES.TOGGLE)
    return null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (typeof value === "object") return null;
  const option = field?.options?.find((o) => String(o.value) === String(value));
  if (option) return versioned(key, shortLabel(option.label));
  if (typeof value === "number")
    return withUnit(value, fieldLabel(definition, key));
  return versioned(key, String(value));
};

// "PostgreSQL, t3.medium, 100 GB": at most three parameters, the service's
// summary keys or else the first set ones in catalog order. The wizard's
// collapsed service rows and Review show it too.
export const summaryOf = (name, config, definition) =>
  (SUMMARY_KEYS[name] ?? Object.keys(definition?.fields ?? config))
    .filter((key) => key !== "enabled" && key !== "helmCharts")
    .map((key) => summaryPart(key, config[key], definition))
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

// Icon, official name and the one-line summary of a service.
function ServiceSummary({ name, config }) {
  const definition = getServiceConfig(name);
  const summary =
    summaryOf(name, config, definition) || definition?.description || "";
  return (
    <>
      <ServiceIcon service={name} className="size-8 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">
          {definition?.displayName || name.toUpperCase()}
        </span>
        {summary ? (
          <span className="truncate text-xs text-muted-foreground">
            {summary}
          </span>
        ) : null}
      </span>
    </>
  );
}

const ROWS =
  "divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset";
const ROW = "flex w-full items-center gap-3 px-3.5 py-3 text-left";

function ServiceRow({ name, config, open, onOpenChange }) {
  const definition = getServiceConfig(name);
  const entries = configEntries(config);
  if (entries.length === 0) {
    return (
      <li className={ROW}>
        <ServiceSummary name={name} config={config} />
      </li>
    );
  }
  return (
    <li>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          className={`group ${ROW} outline-none transition-[background-color] duration-(--dur-fast) hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
        >
          <ServiceSummary name={name} config={config} />
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--dur-fast) group-data-[state=open]:rotate-90"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border bg-muted/30 px-3.5 py-3 sm:pl-14.5">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  {fieldLabel(definition, key)}
                </dt>
                <dd className="font-mono text-xs wrap-break-word whitespace-pre-wrap">
                  {formatValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/** Services tab: one divided card, each row opens its full read-only config. */
const ServicesList = ({ environment, editHref }) => {
  const services = enabledServiceEntries(environment);
  const expandable = services
    .filter(([, config]) => configEntries(config).length > 0)
    .map(([name]) => name);
  const [expanded, setExpanded] = useState({});
  const allExpanded =
    expandable.length > 0 && expandable.every((name) => expanded[name]);
  const toggleAll = () =>
    setExpanded(
      allExpanded
        ? {}
        : Object.fromEntries(expandable.map((name) => [name, true])),
    );

  if (services.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No services enabled"
        description="Edit the environment to choose the AWS services to generate."
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to={editHref}>
              <Pencil aria-hidden />
              Edit environment
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <SettingsSection
      title="Services"
      description="The AWS services this environment generates code for."
      action={
        expandable.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {allExpanded ? (
              <ChevronsDownUp aria-hidden />
            ) : (
              <ChevronsUpDown aria-hidden />
            )}
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
        ) : null
      }
    >
      <ul className={ROWS}>
        {services.map(([name, config]) => (
          <ServiceRow
            key={name}
            name={name}
            config={config}
            open={Boolean(expanded[name])}
            onOpenChange={(open) =>
              setExpanded((prev) => ({ ...prev, [name]: open }))
            }
          />
        ))}
      </ul>
    </SettingsSection>
  );
};

/** Overview card: the first `limit` services and a link to the tab. */
export function ServicesPreview({ environment, servicesHref, limit = 5 }) {
  const services = enabledServiceEntries(environment);
  return (
    <SettingsSection
      title="Services"
      description="What this environment generates code for."
    >
      {services.length > 0 ? (
        <ul className={ROWS}>
          {services.slice(0, limit).map(([name, config]) => (
            <li key={name} className={ROW}>
              <ServiceSummary name={name} config={config} />
            </li>
          ))}
          <li>
            <Link
              to={servicesHref}
              className="flex h-10 items-center px-3.5 text-sm text-muted-foreground outline-none transition-[color,background-color] duration-(--dur-fast) hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              View all services
            </Link>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No services enabled.</p>
      )}
    </SettingsSection>
  );
}

export default ServicesList;
