import { CircleCheck, MapPin } from "lucide-react";
import {
  generations,
  regionsInUse,
  servicesByCategory,
  statusBreakdown,
  summarizeEnvironments,
} from "../utils/environmentStats";
import { RelativeTime, formatRelative } from "@/components/shared/format";
import { StatCard } from "@/components/shared/settings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// The stat strip of the environments list (DESIGN 6.1): four tiles, each with
// a small picture drawn only from the environments themselves. Pictures are
// hidden below sm, where the tiles shrink to one line.

const TONE_BG = {
  success: "bg-primary",
  destructive: "bg-destructive",
  warning: "bg-warning",
  neutral: "bg-muted-foreground/40",
};

const DAY = 86_400_000;
const TOP_CATEGORIES = 3;
const MAX_REGIONS = 4;

/** One whole split by status: an 8 px bar with 2 px gaps, then its legend. */
function StatusBar({ parts, total }) {
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden className="flex h-2 gap-0.5">
        {parts.map((part) => (
          <Tooltip key={part.key}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "min-w-2 basis-0 rounded-full",
                  TONE_BG[part.tone],
                )}
                style={{ flexGrow: part.count }}
              />
            </TooltipTrigger>
            <TooltipContent>
              {part.label}: {part.count} of {total}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {parts.map((part) => (
          <li key={part.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("size-2 rounded-full", TONE_BG[part.tone])}
            />
            {part.label}
            <span className="font-medium text-foreground tabular-nums">
              {part.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The largest categories as one-color bars, the count at each tip. */
function CategoryBars({ rows }) {
  const top = rows.slice(0, TOP_CATEGORIES);
  const max = top[0]?.count ?? 1;
  return (
    <ul className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
      {top.map(({ category, count }) => (
        <li
          key={category}
          className="col-span-2 grid grid-cols-subgrid items-center"
        >
          <span className="text-muted-foreground">{category}</span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-1.5 rounded-r-full bg-chart-1"
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

/** The regions by city, most environments first. */
function RegionChips({ regions }) {
  const shown = regions.slice(0, MAX_REGIONS);
  const rest = regions.length - shown.length;
  const chip =
    "inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs";
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map(({ region, city, count }) => (
        <li key={region} className={chip}>
          <MapPin aria-hidden className="size-3 text-muted-foreground" />
          {city}
          {count > 1 ? (
            <span className="text-muted-foreground tabular-nums">
              {count}
              <span className="sr-only"> environments</span>
            </span>
          ) : null}
        </li>
      ))}
      {rest > 0 ? (
        <li className={cn(chip, "text-muted-foreground")}>
          +{rest}
          <span className="sr-only"> more</span>
        </li>
      ) : null}
    </ul>
  );
}

const outcome = (item) =>
  `${item.name}: ${item.status === "failed" ? "failed" : "generated"} ${formatRelative(item.at)}`;

/**
 * The last successful environment, then every environment's last generate as
 * a dot on a line from the oldest (at least 30 days back) to now.
 */
function Freshness({ items, now }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No environment generated yet.
      </p>
    );
  }
  const last = items.findLast((item) => item.status === "succeeded");
  const start = Math.min(Date.parse(items[0].at), now - 30 * DAY);
  const left = (at) =>
    `${Math.min(100, Math.max(0, ((Date.parse(at) - start) / (now - start)) * 100))}%`;
  return (
    <div className="flex flex-col gap-1.5">
      {last ? (
        // Plain text: the environment's own card below is its link.
        <p className="flex min-w-0 items-center gap-1.5 text-xs">
          <CircleCheck aria-hidden className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium">{last.name}</span>
        </p>
      ) : null}
      <div aria-hidden className="relative mx-1.5 h-6">
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
                    item.status === "failed" ? "bg-destructive" : "bg-primary",
                  )}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>{outcome(item)}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div
        aria-hidden
        className="flex justify-between text-xs text-muted-foreground"
      >
        <span>{formatRelative(new Date(start).toISOString(), now)}</span>
        <span>Now</span>
      </div>
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.id}>{outcome(item)}</li>
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
          <StatusBar
            parts={statusBreakdown(environments)}
            total={stats.total}
          />
        </StatCard>
        <StatCard compact label="Services enabled" value={stats.services}>
          <CategoryBars rows={servicesByCategory(environments)} />
        </StatCard>
        <StatCard compact label="Regions" value={stats.regions}>
          <RegionChips regions={regionsInUse(environments)} />
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
