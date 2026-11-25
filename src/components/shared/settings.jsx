// Settings page building blocks: sections, row groups, rows, toggle rows, HelpTooltip, StatCard.
import { CircleQuestionMark, Lock } from "lucide-react";
import { useId } from "react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, TOUCH_HIT } from "@/lib/utils";

/** H2 `text-base font-medium` + description, 12 px to the content; pages stack sections gap-8. */
export function SettingsSection({ title, description, action, children }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      data-slot="settings-section"
      className="flex flex-col gap-3"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={id} className="text-base font-medium">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Help tooltip for terms (state backend, region, prefix); max two lines. */
export function HelpTooltip({ children, label }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label ?? "More information"}
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            TOUCH_HIT,
          )}
        >
          <CircleQuestionMark className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{children}</TooltipContent>
    </Tooltip>
  );
}

/** The row card: a ring-inset card whose rows are divided by hairlines. */
export function SettingsRowGroup({ children, className }) {
  return (
    <div
      data-slot="settings-row-group"
      className={cn(
        "divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * One setting: title `text-sm font-medium`, a one-sentence description `text-xs` (what happens,
 * consequences included) and exactly one control on the right (below sm and for `fullWidth`
 * controls such as textareas: under the text). `lockedReason` shows the admin lock ("Set by
 * your admin").
 */
export function SettingsRow({
  title,
  description,
  control,
  controlId,
  fullWidth = false,
  lockedReason,
}) {
  return (
    <div
      data-slot="settings-row"
      className={cn(
        "flex flex-col gap-3 p-3.5",
        !fullWidth && "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        {controlId ? (
          <label htmlFor={controlId} className="text-sm font-medium">
            {title}
          </label>
        ) : (
          <p className="text-sm font-medium">{title}</p>
        )}
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {lockedReason ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            {lockedReason}
          </p>
        ) : null}
      </div>
      <div className={cn("flex shrink-0 items-center", fullWidth && "w-full")}>
        {control}
      </div>
    </div>
  );
}

/** Autosaving switch row; `lockedReason` shows the admin lock and disables the switch. */
export function SettingToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  lockedReason,
}) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div data-slot="setting-toggle-row">
      <SettingsRow
        title={label}
        controlId={id}
        description={
          description ? <span id={descId}>{description}</span> : undefined
        }
        lockedReason={lockedReason}
        control={
          <Switch
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled || lockedReason !== undefined}
            aria-describedby={description ? descId : undefined}
          />
        }
      />
    </div>
  );
}

/**
 * KPI tile: label `text-xs`, value `text-lg font-semibold`, optional hint. `compact`: below sm
 * one line, value (`text-md`) then label ("2 Environments"), smaller padding and no hint.
 */
export function StatCard({ label, value, hint, compact = false }) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex flex-col gap-0.5 rounded-lg bg-card p-2.5 shadow-(--shadow-ring-xs)",
        // Below sm: "3 Services" on one line; a long value pushes the whole
        // label to the next line rather than breaking it.
        compact &&
          "max-sm:flex-row max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-1.5 max-sm:gap-y-0 max-sm:px-2.5 max-sm:py-1.5",
      )}
    >
      <p
        className={cn(
          "text-xs text-muted-foreground",
          compact && "max-sm:whitespace-nowrap",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          compact && "max-sm:order-first max-sm:text-md",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            compact && "max-sm:hidden",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
