// "Start with a template" on the Services and Helm charts steps (spec 37):
// one card per template, a preview on top built from the real service icons
// or chart logos it turns on, then its name, one line and a count.
import { useId } from "react";
import ServiceIcon from "../../icons/ServiceIcon";
import { chartLogo } from "../../../config/logos";
import { LogoTile } from "@/components/shared/logo-tile";
import { SettingsSection } from "@/components/shared/settings";
import { cn } from "@/lib/utils";

// The RadioCard look (DESIGN 5.19) as one button; keyboard focus adds a ring
// offset so it reads apart from hover.
const CARD = cn(
  "flex flex-col overflow-hidden rounded-lg border bg-card text-left text-sm outline-none",
  "transition-[border-color,transform] duration-(--dur-fast) hover:border-ring/60 active:scale-[0.99]",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

/**
 * A dashed group with its service's icon on the corner, as in an AWS
 * architecture diagram: the network around what runs in it, the cluster
 * around its charts.
 */
function Frame({ service, children }) {
  return (
    <span className="relative flex items-center gap-1.5 rounded-lg border border-dashed border-input px-5 py-3.5">
      <ServiceIcon
        service={service}
        className="absolute -top-2.5 -left-2.5 size-5"
      />
      {children}
    </span>
  );
}

// Networks frame what runs in them; regional services sit beside the frame.
const NETWORKS = new Set(["vpc", "vnet"]);
const REGIONAL = new Set(["s3"]);

function ServicesPreview({ services }) {
  const network = services.find((name) => NETWORKS.has(name));
  const icon = (name) => (
    <ServiceIcon key={name} service={name} className="size-9" />
  );
  const inside = services
    .filter((name) => name !== network && !REGIONAL.has(name))
    .map(icon);
  const outside = services.filter((name) => REGIONAL.has(name)).map(icon);
  return (
    <>
      {network ? <Frame service={network}>{inside}</Frame> : inside}
      {outside.length > 0 ? (
        <>
          <span className="h-px w-5 bg-input" />
          {outside}
        </>
      ) : null}
    </>
  );
}

/** The cluster holding the charts' logos; a logo two charts share shows once. */
function ChartsPreview({ charts, cluster }) {
  const tiles = charts
    .map(chartLogo)
    .filter(
      (tile, i, all) =>
        !tile.logo || all.findIndex((t) => t.logo === tile.logo) === i,
    );
  return (
    <Frame service={cluster}>
      {tiles.map((tile, i) => (
        <LogoTile key={tile.logo ?? i} {...tile} />
      ))}
    </Frame>
  );
}

const NOUNS = { services: "service", charts: "chart" };

function TemplateCard({ kind, cluster, label, description, items, onApply }) {
  const id = useId();
  const noun = NOUNS[kind];
  return (
    <button
      type="button"
      aria-labelledby={`${id}-name`}
      aria-describedby={`${id}-description ${id}-count`}
      onClick={onApply}
      className={CARD}
    >
      <span
        aria-hidden
        data-slot="template-preview"
        className="flex h-24 items-center justify-center gap-2 bg-muted/60"
      >
        {kind === "charts" ? (
          <ChartsPreview charts={items} cluster={cluster} />
        ) : (
          <ServicesPreview services={items} />
        )}
      </span>
      <span className="flex flex-col gap-0.5 p-3">
        <span className="flex items-baseline justify-between gap-2">
          <span id={`${id}-name`} className="font-medium">
            {label}
          </span>
          <span
            id={`${id}-count`}
            className="shrink-0 text-xs text-muted-foreground tabular-nums"
          >
            {items.length} {items.length === 1 ? noun : `${noun}s`}
          </span>
        </span>
        <span
          id={`${id}-description`}
          className="text-xs text-muted-foreground"
        >
          {description}
        </span>
      </span>
    </button>
  );
}

/**
 * The template cards of a step. `kind` is "services" or "charts" (then
 * `cluster` names the Kubernetes service); each template is `{ label,
 * description, items, onApply }`, `items` being the keys it turns on.
 */
export default function StarterTemplates({ kind, cluster, templates }) {
  return (
    <SettingsSection title="Start with a template">
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.label}
            kind={kind}
            cluster={cluster}
            {...template}
          />
        ))}
      </div>
    </SettingsSection>
  );
}
