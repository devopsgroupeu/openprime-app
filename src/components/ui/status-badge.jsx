import { StatusPill } from "@/components/shared/badges";
import { statusDisplay } from "@/utils/environmentStats";

/**
 * StatusBadge - the one environment/job status pill (thin wrapper over
 * StatusPill). `status` is the effective status; statusDisplay decides the
 * label, tone and pill (Ready, Not generated, Failed, Processing...).
 */
export function StatusBadge({ status }) {
  const { tone, pill, label } = statusDisplay(status);
  return <StatusPill status={pill} label={label} data-tone={tone} />;
}
