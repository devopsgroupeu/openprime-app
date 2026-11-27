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

const TONE = {
  success: { fill: "bg-primary", stroke: "stroke-primary" },
  destructive: { fill: "bg-destructive", stroke: "stroke-destructive" },
  warning: { fill: "bg-warning", stroke: "stroke-warning" },
  neutral: {
    fill: "bg-muted-foreground/40",
    stroke: "stroke-muted-foreground/40",
  },
};

const DAY = 86_400_000;
const RECENT = 3;

const Swatch = ({ className }) => (
  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", className)} />
);

// The ring's circle has a circumference of 100, so a part's share is its
// length; round caps add STROKE to each part, so they come off it.
const R = 50 / Math.PI;
const STROKE = 4.5;
const GAP = 3;

/**
 * One whole split by status as a ring with the Ready share in its middle,
 * and its legend: beside it from a 15rem tile, else a smaller ring with the
 * legend wrapping under it.
 */
function StatusRing({ parts, total }) {
  const ready = parts.find((part) => part.key === "ready")?.count ?? 0;
  const whole = parts.length === 1;
  let start = 0;
  return (
    <div className="flex flex-col items-start gap-3 @[15rem]:flex-row @[15rem]:items-center @[15rem]:gap-5">
      <div className="relative size-16 shrink-0 @[15rem]:size-20">
        <svg aria-hidden viewBox="0 0 40 40" className="size-full -rotate-90">
          {parts.map((part) => {
            const share = (part.count / total) * 100;
            const length = whole ? 100 : Math.max(share - GAP - STROKE, 0.01);
            const offset = whole ? 0 : start + (GAP + STROKE) / 2;
            start += share;
            return (
              <Tooltip key={part.key}>
                <TooltipTrigger asChild>
                  <circle
                    cx="20"
                    cy="20"
                    r={R}
                    fill="none"
                    strokeWidth={STROKE}
                    strokeLinecap={whole ? "butt" : "round"}
                    strokeDasharray={`${length} ${100 - length}`}
                    strokeDashoffset={-offset}
                    className={TONE[part.tone].stroke}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {part.label}: {part.count} of {total}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
          <span className="text-sm font-semibold tabular-nums">
            {Math.round((ready / total) * 100)}%
          </span>
          <span className="text-xs text-muted-foreground">ready</span>
        </p>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs @[15rem]:flex-col @[15rem]:gap-1.5">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-2">
            <Swatch className={TONE[part.tone].fill} />
            <span className="text-muted-foreground">{part.label}</span>
            <span className="font-medium tabular-nums">{part.count}</span>
          </li>
        ))}
      </ul>
    </div>
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
          <StatusRing
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
