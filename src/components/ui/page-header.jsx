import { eyebrowClass } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

/**
 * PageHeader - the single in-page title (<h1>) for every page, with an
 * optional eyebrow, leading icon tile, description and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  icon,
  bordered,
  className,
}) {
  return (
    <div className={cn(bordered && "border-b border-border pb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/50 [&_svg]:size-5">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className={cn("mb-1", eyebrowClass)}>{eyebrow}</p>}
            <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[2rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
