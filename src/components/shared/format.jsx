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

const STEPS = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago", "in 2 weeks", "now". */
export function formatRelative(iso, now = Date.now()) {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size)
      return relative.format(Math.round(seconds / size), unit);
  }
  return relative.format(0, "minute");
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
        </button>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(iso)}</TooltipContent>
    </Tooltip>
  );
}
