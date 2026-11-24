import { Link } from "react-router";

import { IconTile } from "@/components/shared/icon-tile";
import { cn } from "@/lib/utils";

/** The only card: ring, tile, name, description, meta footer; actions fade in on hover. */
export function ResourceCard({
  href,
  title,
  description,
  tile,
  icon: Icon,
  color,
  badges,
  meta,
  actions,
}) {
  return (
    <article
      data-slot="resource-card"
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg bg-card p-3.5 text-card-foreground shadow-(--shadow-ring-xs)",
        "transition-[background-color,box-shadow] duration-(--dur-fast) hover:bg-accent/40 hover:shadow-(--shadow-ring-sm)",
        "has-[a[data-stretched]:focus-visible]:ring-2 has-[a[data-stretched]:focus-visible]:ring-ring",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {tile ??
          (Icon ? (
            <IconTile data-slot="resource-tile" icon={Icon} color={color} />
          ) : null)}
        {actions ? (
          <div
            data-slot="resource-card-actions"
            className={cn(
              "relative z-10 -mt-1 -mr-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-(--dur-fast)",
              "group-focus-within:opacity-100 group-hover:opacity-100 has-[[data-state=open]]:opacity-100",
              "max-md:opacity-100 pointer-coarse:opacity-100",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-md font-semibold">
            <Link
              to={href}
              data-stretched
              className="outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']"
            >
              {title}
            </Link>
          </h3>
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
      {meta ? (
        <div
          data-slot="resource-card-meta"
          className="flex min-w-0 flex-wrap items-center divide-x divide-border text-xs text-muted-foreground [&>*]:px-2 [&>*:first-child]:pl-0"
        >
          {meta}
        </div>
      ) : null}
    </article>
  );
}

export function ResourceCardGrid({ children }) {
  return (
    <div
      data-slot="resource-card-grid"
      // Columns follow the available width (a folder rail beside the grid), not the viewport.
      className="motion-stagger grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4 [&>*]:motion-enter"
    >
      {children}
    </div>
  );
}
