import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/** A grid of radio cards (DESIGN 5.19); props go to the Radix RadioGroup. */
export function RadioCardGroup({ className, ...props }) {
  return (
    <RadioGroup
      className={cn("grid grid-cols-1 gap-3", className)}
      {...props}
    />
  );
}

/**
 * Radio card: optional `art` band on top, radio + `title`, then an optional
 * `badge` and a one-line `description`; selected = `border-ring ring-2 ring-ring`,
 * keyboard focus adds a ring offset so it differs from selection (DESIGN 3.8).
 */
export function RadioCard({
  id,
  value,
  title,
  description,
  art,
  badge,
  disabled,
}) {
  return (
    <Label
      htmlFor={id}
      data-slot="radio-card"
      className={cn(
        "flex cursor-pointer flex-col items-stretch gap-0 overflow-hidden rounded-lg border bg-card p-0 text-sm leading-normal font-normal",
        "transition-[border-color,box-shadow] duration-(--dur-fast) hover:border-ring/60",
        "has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
        "has-[button:disabled]:cursor-not-allowed has-[button:disabled]:text-muted-foreground has-[button:disabled]:hover:border-border",
      )}
    >
      {art ? (
        <span
          aria-hidden
          className="flex h-14 items-center justify-center bg-muted/60"
        >
          {art}
        </span>
      ) : null}
      <span className="flex items-start gap-2.5 p-3">
        <RadioGroupItem
          id={id}
          value={value}
          disabled={disabled}
          className="mt-0.5"
        />
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="font-medium">{title}</span>
          {badge}
          {description ? (
            <span className="text-xs text-muted-foreground">{description}</span>
          ) : null}
        </span>
      </span>
    </Label>
  );
}
