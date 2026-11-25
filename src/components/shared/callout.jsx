import { CircleAlert, Info, Lightbulb, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

// Callout strips: text stays text-foreground; the hue colors only the icon and ring.
const VARIANTS = {
  info: { box: "bg-info/10 ring-info/20", icon: "text-info", Icon: Info },
  warning: {
    box: "bg-warning/10 ring-warning/30",
    icon: "text-warning",
    Icon: TriangleAlert,
  },
  neutral: {
    box: "bg-muted ring-border",
    icon: "text-muted-foreground",
    Icon: Lightbulb,
  },
  error: {
    box: "bg-destructive/10 ring-destructive/20",
    icon: "text-destructive",
    Icon: CircleAlert,
  },
};

/**
 * One-line or short callout (`rounded-lg px-3 py-2 text-sm`): optional bold `title` before the
 * text, inline links in `children` (underlined), an optional `action` on the right.
 */
export function Callout({
  variant = "info",
  title,
  icon,
  action,
  className,
  children,
}) {
  const v = VARIANTS[variant];
  const Icon = icon ?? v.Icon;
  return (
    <div
      data-slot="callout"
      data-variant={variant}
      // An error that appears (a failed job) is announced; hints are not.
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-foreground ring-1 ring-inset",
        "[&_a]:underline [&_a]:underline-offset-2",
        v.box,
        className,
      )}
    >
      <Icon className={cn("mt-px size-4 shrink-0", v.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <span className="font-medium">{title} </span> : null}
        {children}
      </div>
      {action ? <div className="-my-1 shrink-0">{action}</div> : null}
    </div>
  );
}
