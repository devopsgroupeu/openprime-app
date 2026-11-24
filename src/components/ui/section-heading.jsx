/**
 * eyebrowClass - the one uppercase label recipe (PageHeader eyebrow, in-page
 * group labels). Compose with cn() for spacing or colour; never re-invent the
 * size, weight or tracking.
 */
export const eyebrowClass =
  "text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground";

/**
 * SectionHeading - the in-page section title (<h2>) for grouped content, with
 * an optional purpose line and right-aligned actions.
 */
export function SectionHeading({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
