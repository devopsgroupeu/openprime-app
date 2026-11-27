// Relative dates with the absolute in a tooltip; locale fixed to `en`.
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const absolute = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatDateTime = (iso) => `${absolute.format(new Date(iso))} UTC`;

// [unit, seconds, short unit]
const STEPS = [
  ["year", 365 * 86_400, "y"],
  ["month", 30 * 86_400, "mo"],
  ["week", 7 * 86_400, "w"],
  ["day", 86_400, "d"],
  ["hour", 3600, "h"],
  ["minute", 60, "m"],
];

/** "3 days ago", "in 2 weeks", "now". */
export function formatRelative(iso, now = Date.now()) {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size)
      return relative.format(Math.round(seconds / size), unit);
  }
  // Under a minute: "now" (`numeric: "auto"` reads 0 minutes as "this minute").
  return relative.format(0, "second");
}

/** "2h", "5d", "5mo": the age of a past time in short (the steps of formatRelative), "now" under a minute. */
export function formatAge(iso, now = Date.now()) {
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  for (const [, size, short] of STEPS) {
    if (seconds >= size) return `${Math.round(seconds / size)}${short}`;
  }
  return "now";
}

/** Relative time with the absolute UTC time in a tooltip (focusable for keyboard users). */
export function RelativeTime({ iso }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="rounded-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <time dateTime={iso}>{formatRelative(iso)}</time>
          {/* The tooltip is hidden on touch; the name keeps the exact time. */}
          <span className="sr-only">{`, ${formatDateTime(iso)}`}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(iso)}</TooltipContent>
    </Tooltip>
  );
}
