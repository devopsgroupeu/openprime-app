import { StatusPill } from "@/components/shared/badges";

// Environment/job status -> [tone, StatusPill status]: success check,
// in-flight spinner ("processing"), error alert, plain neutral.
const STATUSES = {
  running: ["success", "ready"],
  succeeded: ["success", "ready"],
  stopped: ["neutral", "stopped"],
  failed: ["destructive", "failed"],
  error: ["destructive", "failed"],
  pending: ["warning", "processing"],
  deploying: ["warning", "processing"],
  queued: ["warning", "processing"],
};

/** "Running", "Deploying"...; a missing status reads "Unknown". */
export const statusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

/** StatusBadge - the one environment/job status pill (thin wrapper over StatusPill). */
export function StatusBadge({ status }) {
  const [tone, pill] = STATUSES[status] ?? ["neutral", "unknown"];
  return (
    <StatusPill status={pill} label={statusLabel(status)} data-tone={tone} />
  );
}
