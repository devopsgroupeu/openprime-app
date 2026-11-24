import { StatusPill } from "@/components/shared/badges";

// Environment/job status -> tone -> the shared status pill that draws it
// (success check, in-flight spinner, error alert, plain neutral).
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

const TONE_PILL = {
  success: "ready",
  warning: "processing",
  destructive: "couldntConnect",
  neutral: "invited",
};

const label = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

/** StatusBadge - the one environment/job status pill (thin wrapper over StatusPill). */
export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <StatusPill
      status={TONE_PILL[tone]}
      label={label(status)}
      data-tone={tone}
    />
  );
}
