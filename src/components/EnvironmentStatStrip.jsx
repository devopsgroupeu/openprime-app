import { CircleAlert, CircleCheck, CircleDashed, Loader } from "lucide-react";
import {
  foldCategories,
  generations,
  regionsInUse,
  servicesByCategory,
  statusBreakdown,
  summarizeEnvironments,
} from "../utils/environmentStats";
import { RegionMap } from "./environments/RegionMap";
import { RelativeTime, formatRelative } from "@/components/shared/format";
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

const DAY = 86_400_000;
const RECENT = 3;

const Swatch = ({ className }) => (
  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", className)} />
);

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

// At most this many rows; more categories fold into "Other".
const MAX_CATEGORIES = 6;

/** The categories as one-color bars from a common start, the count at the tip. */
function CategoryBars({ rows: all }) {
  const rows = foldCategories(all, MAX_CATEGORIES);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
      {rows.map(({ category, count, other }) => (
        <li
          key={category}
          className="col-span-2 grid grid-cols-subgrid items-center"
        >
          <span className="text-muted-foreground">{category}</span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                "h-2 rounded-r-sm",
                other ? "bg-muted-foreground/40" : "bg-chart-1",
              )}
              style={{
                width: `max(0.25rem, calc((100% - 2rem) * ${count / max}))`,
              }}
            />
            <span className="font-medium tabular-nums">{count}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The regions on a map; their names are in the dots' tooltips and, as text, for screen readers. */
function Regions({ regions }) {
  return (
    <>
      <RegionMap regions={regions} />
      <ul className="sr-only">
        {regions.map(({ region, name, count }) => (
          <li key={region}>
            {name}: {count} {count === 1 ? "environment" : "environments"}
          </li>
        ))}
      </ul>
    </>
  );
}

const outcomeLabel = (item) =>
  item.status === "failed" ? "failed" : "generated";
const outcomeFill = (item) =>
  item.status === "failed" ? "bg-destructive" : "bg-primary";

/**
 * Every environment's last generate as a dot on a line from the oldest (at
 * least 30 days back) to now, then the most recent ones by name.
 */
function Freshness({ items, now }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No environment generated yet.
      </p>
    );
  }
  const start = Math.min(Date.parse(items[0].at), now - 30 * DAY);
  const left = (at) =>
    `${Math.min(100, Math.max(0, ((Date.parse(at) - start) / (now - start)) * 100))}%`;
  const recent = items.slice(-RECENT).reverse();
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden>
        <div className="relative mx-1.5 h-6">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {items.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                {/* A 24 px hit area around the 10 px dot. */}
                <span
                  className="absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: left(item.at) }}
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full ring-2 ring-card",
                      outcomeFill(item),
                    )}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {item.name}: {outcomeLabel(item)} {formatRelative(item.at, now)}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatRelative(new Date(start).toISOString(), now)}</span>
          <span>Now</span>
        </div>
      </div>
      <ul className="flex flex-col gap-1 text-xs">
        {recent.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <Swatch className={outcomeFill(item)} />
            <span className="min-w-0 flex-1 truncate font-medium">
              {item.name}
              <span className="sr-only">: {outcomeLabel(item)}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatRelative(item.at, now)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EnvironmentStatStrip({ environments }) {
  const stats = summarizeEnvironments(environments);
  const now = Date.now();
  return (
    // Compact below sm so the first card stays above the fold; four in a row
    // once the content column is 42rem wide, with or without the sidebar.
    <div className="@container">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 @2xl:grid-cols-4">
        <StatCard compact label="Environments" value={stats.total}>
          <StatusRows
            parts={statusBreakdown(environments)}
            total={stats.total}
          />
        </StatCard>
        <StatCard compact label="Services enabled" value={stats.services}>
          <CategoryBars rows={servicesByCategory(environments)} />
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
          <Freshness items={generations(environments)} now={now} />
        </StatCard>
      </div>
    </div>
  );
}
