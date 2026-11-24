// Loading skeletons that match the final layouts: no fade, no layout shift.
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the page layouts: header, ring cards, h-10 / h-13 table rows, row cards; real radii.
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
          className="flex flex-col gap-3 rounded-lg bg-card p-3.5 shadow-(--shadow-ring-xs)"
        >
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }) {
  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-lg border bg-card">
      <div className="flex h-10 items-center bg-muted/50 px-4">
        <Skeleton className="h-3 w-1/3" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-13 items-center px-4">
          <Skeleton className="h-4 w-full" />
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

export function ListPageSkeleton({ table = false }) {
  return (
    <Busy>
      <HeaderSkeleton />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-56 rounded-lg" />
        <Skeleton className="h-8 w-72 rounded-lg" />
      </div>
      {table ? <TableSkeleton /> : <CardGridSkeleton />}
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
