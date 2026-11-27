import { CircleAlert, CircleCheck, CircleDashed, Loader } from "lucide-react";
import { Fragment, useState } from "react";
import {
  byProviderOrder,
  generations,
  providerLegendName,
  providerName,
  regionsInUse,
  servicesInUse,
  statusBreakdown,
  summarizeEnvironments,
} from "../utils/environmentStats";
import { RegionMap, regionTone } from "./environments/RegionMap";
import ProviderIcon from "./icons/ProviderIcon";
import ServiceIcon from "./icons/ServiceIcon";
import {
  RelativeTime,
  formatAge,
  formatDateTime,
  formatRelative,
} from "@/components/shared/format";
import { StatCard } from "@/components/shared/settings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// The stat strip of the environments list (DESIGN 6.1): four tiles, each with
// a picture drawn only from the environments themselves. Pictures are hidden
// below sm, where the tiles shrink to one line.

// A status's color and icon; the icons are the StatusPill ones where it has one.
const TONE = {
  success: { fill: "bg-primary", text: "text-primary", Icon: CircleCheck },
  destructive: {
    fill: "bg-destructive",
    text: "text-destructive",
    Icon: CircleAlert,
  },
  warning: { fill: "bg-warning", text: "text-warning", Icon: Loader },
  neutral: {
    fill: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    Icon: CircleDashed,
  },
};

const share = (count, total) => `${Math.round((count / total) * 100)}%`;

/**
 * A row per status that occurs: its icon, label, count and share of all
 * environments (from a 12rem tile), over a thin meter of that share.
 * Statuses are few, so the tile keeps its height.
 */
function StatusRows({ parts, total }) {
  return (
    <ul className="flex flex-col gap-2.5 text-xs">
      {parts.map(({ key, label, tone, count }) => {
        const { Icon, fill, text } = TONE[tone];
        return (
          <li key={key} className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <Icon aria-hidden className={cn("size-3.5 shrink-0", text)} />
              <span className="truncate text-muted-foreground">{label}</span>
              <span className="ml-auto font-medium tabular-nums">{count}</span>
              {/* A narrow tile keeps the name whole; the meter still shows the share. */}
              <span className="hidden w-8 shrink-0 text-right text-muted-foreground tabular-nums @[12rem]:block">
                {share(count, total)}
              </span>
            </span>
            <span
              aria-hidden
              className="h-1 overflow-hidden rounded-full bg-muted"
            >
              <span
                className={cn("block h-full rounded-full", fill)}
                style={{ width: share(count, total) }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Rows in view at once (20 px each, 8 px apart); more scroll inside the tile.
const VISIBLE_ROWS = 4;

/**
 * Rows that scroll inside the tile once `scrolls`, so the tile keeps its
 * height, and fade at an edge with more rows behind it; the scrolling box is
 * a focusable region named `label` so the keyboard can scroll it. Keyed by
 * its rows where used: a list that starts to scroll starts faded.
 */
function ScrollRows({ label, scrolls, children }) {
  const [fade, setFade] = useState({ top: false, bottom: scrolls });
  const onScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    setFade({
      top: scrollTop > 0,
      bottom: scrollTop + clientHeight < scrollHeight - 1,
    });
  };
  return (
    <div className="rounded-sm has-focus-visible:ring-2 has-focus-visible:ring-ring/50">
      <div
        {...(scrolls && {
          role: "region",
          "aria-label": label,
          tabIndex: 0,
          onScroll,
        })}
        className={cn(
          scrolls &&
            "max-h-[6.5rem] overflow-y-auto overscroll-contain outline-none [scrollbar-width:thin]",
          scrolls && fade.top && "mask-t-from-85%",
          scrolls && fade.bottom && "mask-b-from-85%",
        )}
      >
        {children}
      </div>
    </div>
  );
}

const environmentsWord = (n) => (n === 1 ? "environment" : "environments");

/** `rows` (each with a `provider`, already in provider order) split per provider. */
const groupByProvider = (rows) =>
  rows.reduce((groups, row) => {
    const last = groups.at(-1);
    if (last?.provider === row.provider) last.rows.push(row);
    else groups.push({ provider: row.provider, rows: [row] });
    return groups;
  }, []);

/**
 * Every service in use (`servicesInUse`): its icon, short name, a bar of its
 * provider's environments that use it (from a 12rem tile) and "used/all",
 * the full name in a tooltip. Services of several providers come as a list
 * per provider under its logo and name. Past four rows (headings count) the
 * lists scroll (`ScrollRows`).
 */
function ServiceBars({ services }) {
  const groups = groupByProvider(services);
  const grouped = groups.length > 1;
  const scrolls =
    services.length + (grouped ? groups.length : 0) > VISIBLE_ROWS;
  return (
    <ScrollRows label="Services in use" scrolls={scrolls}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-2 text-xs @[12rem]:grid-cols-[auto_auto_1fr_auto]">
        {groups.map(({ provider, rows }) => {
          const who = providerName(provider);
          return (
            <Fragment key={provider}>
              {grouped ? (
                // The list's label says it to screen readers.
                <p
                  aria-hidden
                  className="col-span-full flex h-5 items-center gap-1.5 font-medium text-muted-foreground"
                >
                  <ProviderIcon
                    provider={provider}
                    className="size-3.5 text-muted-foreground"
                  />
                  {who}
                </p>
              ) : null}
              <ul
                aria-label={grouped ? `${who} services` : undefined}
                className="col-span-full grid grid-cols-subgrid gap-y-2"
              >
                {rows.map(({ key, name, title, count, of }) => (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <li className="col-span-full grid h-5 grid-cols-subgrid items-center">
                        <ServiceIcon
                          service={key}
                          className="size-4 rounded-[3px] text-muted-foreground"
                        />
                        <span className="text-muted-foreground">{name}</span>
                        <span
                          aria-hidden
                          className="hidden h-1.5 overflow-hidden rounded-full bg-muted @[12rem]:block"
                        >
                          <span
                            className="block h-full rounded-full bg-chart-1"
                            style={{ width: `${(count / of) * 100}%` }}
                          />
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          <span aria-hidden>
                            <span className="font-medium text-foreground">
                              {count}
                            </span>
                            /{of}
                          </span>
                          <span className="sr-only">
                            : {count} of {of} {environmentsWord(of)}
                          </span>
                        </span>
                      </li>
                    </TooltipTrigger>
                    <TooltipContent>
                      {title}: {count} of {of}
                      {grouped ? ` ${who}` : ""} {environmentsWord(of)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </ul>
            </Fragment>
          );
        })}
      </div>
    </ScrollRows>
  );
}

/**
 * The regions on a map; their names are in the dots' tooltips and, as text,
 * for screen readers. Regions of several providers, or on-premise datacenters
 * (which have no place on the map), add a one-line legend of the providers by
 * name: a dot in the map's color, a hollow one for on-prem. All four need a
 * 198 px tile; a narrower one wraps between names, never inside one.
 */
function Regions({ regions }) {
  const providers = [...new Set(regions.map((r) => r.provider))].sort(
    byProviderOrder,
  );
  const multi = providers.length > 1;
  const legend = multi || providers.includes("onpremise");
  return (
    <>
      <RegionMap regions={regions} />
      {legend ? (
        <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs whitespace-nowrap text-muted-foreground">
          {providers.map((provider) => (
            <li
              key={provider}
              data-provider={provider}
              className="flex items-center gap-1"
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  provider === "onpremise"
                    ? "border border-muted-foreground"
                    : regionTone(provider, multi).dot,
                )}
              />
              {providerLegendName(provider)}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="sr-only">
        {regions.map(({ region, provider, name, count }) => (
          <li key={`${provider}:${region}`}>
            {name}
            {multi ? ` (${providerName(provider)})` : ""}: {count}{" "}
            {environmentsWord(count)}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Every environment's last generate (`generations`) like a CI run list: the
 * outcome icon, name and short age; the tooltip gives the whole name and
 * the exact time. Screen readers hear the outcome and the long age. Past
 * four rows the list scrolls (`ScrollRows`).
 */
function GenerateFeed({ items, now }) {
  return (
    <ScrollRows label="Recent generates" scrolls={items.length > VISIBLE_ROWS}>
      <ul className="flex flex-col gap-2 text-xs">
        {items.map(({ id, name, at, status }) => {
          const failed = status === "failed";
          const { Icon, text } =
            TONE[!at ? "neutral" : failed ? "destructive" : "success"];
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                {/* A 20 px row as in Services; its hit area reaches 24 px. */}
                <li className="relative flex h-5 items-center gap-1.5 before:absolute before:inset-x-0 before:-inset-y-0.5">
                  <Icon aria-hidden className={cn("size-3.5 shrink-0", text)} />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    <span aria-hidden>{at ? formatAge(at, now) : "Never"}</span>
                    <span className="sr-only">
                      :{" "}
                      {at
                        ? `${failed ? "failed" : "generated"} ${formatRelative(at, now)}`
                        : "never generated"}
                    </span>
                  </span>
                </li>
              </TooltipTrigger>
              <TooltipContent>
                {name}:{" "}
                {at
                  ? `${failed ? "generate failed" : "generated"} ${formatDateTime(at)}`
                  : "never generated"}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ul>
    </ScrollRows>
  );
}

export default function EnvironmentStatStrip({ environments }) {
  const stats = summarizeEnvironments(environments);
  const services = servicesInUse(environments);
  const generates = generations(environments);
  const now = Date.now();
  return (
    // Compact below sm so the first card stays above the fold. 2 x 2 until the
    // content column is 59rem wide, where each tile gets 204 px of content: the
    // widest picture, the four-provider region legend, needs 198 px.
    <div className="@container">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 @[59rem]:grid-cols-4">
        <StatCard compact label="Environments" value={stats.total}>
          <StatusRows
            parts={statusBreakdown(environments)}
            total={stats.total}
          />
        </StatCard>
        <StatCard compact label="Services" value={stats.services}>
          {/* Keyed by its rows: a list that starts to scroll starts faded. */}
          <ServiceBars
            key={services.map((s) => `${s.provider}:${s.key}`).join()}
            services={services}
          />
        </StatCard>
        <StatCard compact label="Regions" value={stats.regions}>
          <Regions regions={regionsInUse(environments)} />
        </StatCard>
        <StatCard
          compact
          label="Last generated"
          value={
            stats.lastGenerated ? (
              <RelativeTime iso={stats.lastGenerated} />
            ) : (
              "Never"
            )
          }
        >
          <GenerateFeed
            key={generates.map((g) => g.id).join()}
            items={generates}
            now={now}
          />
        </StatCard>
      </div>
    </div>
  );
}
