// StatusPill: the status next to a title or in a row.
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const STATUS_PILLS = {
  ready: { variant: "success", Icon: CircleCheck, label: "Ready" },
  connected: { variant: "success", Icon: CircleCheck, label: "Connected" },
  processing: { variant: "neutral", Icon: null, label: "Processing" },
  invited: { variant: "neutral", Icon: null, label: "Invited" },
  needsReview: {
    variant: "attention",
    Icon: TriangleAlert,
    label: "Needs review",
  },
  needsSetup: {
    variant: "attention",
    Icon: TriangleAlert,
    label: "Needs setup",
  },
  couldntConnect: {
    variant: "error",
    Icon: CircleAlert,
    label: "Couldn't connect",
  },
  // Environment and job states (StatusBadge).
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
