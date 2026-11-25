// Loading skeletons that match the final layouts: no fade, no layout shift.
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the page layouts: header, ring cards, row cards; real radii.
function HeaderSkeleton({ tile = false }) {
  return (
    <div className="flex items-center gap-3">
      {tile ? <Skeleton className="size-10 rounded-lg" /> : null}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-lg bg-card shadow-(--shadow-ring-xs)"
        >
          {/* The cover band, then name, meta, service icons, modified. */}
          <Skeleton className="h-24 rounded-none sm:h-28" />
          <div className="flex flex-col gap-3 p-3.5">
            {/* Bars inset in the real line heights (20, 16, 20, 16 px). */}
            <div className="flex flex-col gap-1">
              <Skeleton className="my-0.5 h-4 w-2/3" />
              <Skeleton className="my-0.5 h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="my-0.5 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Wrapper role for every page skeleton: busy, labelled, not announced repeatedly. */
function Busy({ children, className = "flex flex-col gap-6" }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={className}
    >
      {children}
    </div>
  );
}

/** `stats`: the list's stat strip (tiles), so the cards do not jump. */
export function ListPageSkeleton({ stats = 0 }) {
  return (
    <Busy>
      <HeaderSkeleton />
      {stats > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <Skeleton
              key={i}
              data-slot="stat-card-skeleton"
              className="h-9 rounded-lg sm:h-16.5"
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-8 w-72 rounded-lg" />
      </div>
      <CardGridSkeleton />
    </Busy>
  );
}

export function DetailPageSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton tile />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </Busy>
  );
}

export function SettingsPageSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </Busy>
  );
}
