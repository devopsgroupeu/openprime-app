// StatusPill: the status next to a title or in a row.
import { CircleAlert, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

// Environment and job states (StatusBadge).
const STATUS_PILLS = {
  ready: { variant: "success", Icon: CircleCheck, label: "Ready" },
  processing: { variant: "neutral", Icon: null, label: "Processing" },
  notGenerated: { variant: "neutral", Icon: null, label: "Not generated" },
  stopped: { variant: "neutral", Icon: null, label: "Stopped" },
  failed: { variant: "error", Icon: CircleAlert, label: "Failed" },
  unknown: { variant: "neutral", Icon: null, label: "Unknown" },
};

/** Status next to a title (Ready, Processing, Needs review...); text and icon carry meaning. */
export function StatusPill({ status, label, ...props }) {
  const { variant, Icon, label: fallback } = STATUS_PILLS[status];
  return (
    <Badge
      variant={variant}
      data-slot="status-pill"
      data-status={status}
      {...props}
    >
      {status === "processing" ? (
        <Spinner className="size-3" aria-hidden />
      ) : Icon ? (
        <Icon aria-hidden />
      ) : null}
      {label ?? fallback}
    </Badge>
  );
}
