import { Badge } from "@/components/ui/badge";

// Status -> tone. Tones map onto the tokenized Badge variants, never raw
// palette colours, so status pills stay on theme in light and dark mode.
const STATUS_TONE = {
  running: "success",
  succeeded: "success",
  stopped: "neutral",
  failed: "destructive",
  error: "destructive",
  pending: "warning",
  deploying: "warning",
  queued: "warning",
};

const TONE_VARIANT = {
  success: "default",
  warning: "secondary",
  destructive: "destructive",
  neutral: "outline",
};

const label = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

/** StatusBadge - the one environment/job status pill. */
export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <Badge variant={TONE_VARIANT[tone]} data-tone={tone}>
      {tone === "warning" && (
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse rounded-full bg-current"
        />
      )}
      {label(status)}
    </Badge>
  );
}
