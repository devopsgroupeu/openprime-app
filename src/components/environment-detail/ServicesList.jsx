import { useState } from "react";
import { Link } from "react-router";
import {
  Box,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pencil,
} from "lucide-react";
import { getServiceConfig } from "../../config/servicesConfig";
import ServiceIcon from "../icons/ServiceIcon";
import { SettingsSection } from "@/components/shared/settings";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// The key parameters of a service, shown on its row.
const IMPORTANT_KEYS = {
  vpc: ["cidrBlock", "region", "enableDnsSupport"],
  eks: ["version", "nodeGroups", "addons"],
  rds: ["engine", "instanceType", "allocatedStorage"],
  s3: ["bucketName", "versioning", "encryption"],
  ecr: ["repositoryName", "imageScanningConfiguration"],
  opensearch: ["version", "instanceType", "instanceCount"],
  lambda: ["runtime", "memorySize", "timeout"],
  elasticache: ["engine", "nodeType", "numNodes"],
  secretsmanager: ["secretName", "description"],
  iam: ["roleName", "policies"],
};

const humanizeKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fieldLabel = (definition, key) =>
  definition?.fields?.[key]?.displayName || humanizeKey(key);

const formatValue = (value) => {
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

// "v1.31, Node Groups 2, vpc-cni": the important keys that are set, else the
// first three parameters.
const summaryOf = (name, config, definition) => {
  const entries = configEntries(config);
  const keys = IMPORTANT_KEYS[name]?.filter((k) => k in config);
  const picked = keys?.length
    ? entries.filter(([k]) => keys.includes(k))
    : entries.slice(0, 3);
  return picked
    .map(([key, value]) => {
      if (value === false || value === null || value === undefined) return null;
      if (/version$/i.test(key)) return `v${value}`;
      if (value === true)
        return fieldLabel(definition, key).replace(/^Enable\s+/, "");
      if (typeof value === "number")
        return `${fieldLabel(definition, key)} ${value}`;
      if (typeof value === "object")
        return Array.isArray(value) ? value.join(", ") : null;
      return String(value);
    })
    .filter(Boolean)
    .join(", ");
};

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
