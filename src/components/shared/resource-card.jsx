import { Link } from "react-router";

import { cn } from "@/lib/utils";

/**
 * The only card: a `cover` (a CoverGradient band carrying the avatar) on top,
 * then name, description, optional `children` above the meta footer. The
 * actions fade in on hover, on the band in their own solid surface. It enters
 * with `motion-enter`, staggered by ResourceCardGrid.
 */
export function ResourceCard({
  href,
  title,
  description,
  cover,
  badges,
  meta,
  actions,
  children,
}) {
  return (
    <article
      data-slot="resource-card"
      className={cn(
        "group motion-enter relative flex flex-col overflow-hidden rounded-lg bg-card text-card-foreground shadow-(--shadow-ring-xs)",
        "transition-[background-color,box-shadow] duration-(--dur-fast) hover:bg-accent/40 hover:shadow-(--shadow-ring-sm)",
        "has-[a[data-stretched]:focus-visible]:ring-2 has-[a[data-stretched]:focus-visible]:ring-ring",
      )}
    >
      {cover}
      {actions ? (
        <div
          data-slot="resource-card-actions"
          // aria-expanded, not data-state: the "More actions" tooltip owns
          // the trigger's data-state, so it never reads "open". Never a bare
          // control on the gradient: the pill is its solid surface.
          className={cn(
            "absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg bg-card shadow-(--shadow-ring-xs) opacity-0 transition-opacity duration-(--dur-fast)",
            "group-focus-within:opacity-100 group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100",
            "max-md:opacity-100 pointer-coarse:opacity-100",
          )}
        >
          {actions}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-md font-semibold">
              <Link
                to={href}
                // The link covers the card, so a truncated name shows on hover.
                title={typeof title === "string" ? title : undefined}
                data-stretched
                className="outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
              >
                {title}
              </Link>
            </h2>
            {badges ? (
              <div className="flex shrink-0 items-center gap-1">{badges}</div>
            ) : null}
          </div>
          {description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children}
        {meta ? (
          <div
            data-slot="resource-card-meta"
            className="flex min-w-0 flex-wrap items-center divide-x divide-border text-xs text-muted-foreground [&>*]:px-2 [&>*:first-child]:pl-0"
          >
            {meta}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ResourceCardGrid({ children }) {
  return (
    <div
      data-slot="resource-card-grid"
      // Columns follow the available width (a folder rail beside the grid), not the viewport.
      className="motion-stagger grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4"
    >
      {children}
    </div>
  );
}
