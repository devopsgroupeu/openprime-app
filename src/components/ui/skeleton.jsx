import { cn } from "@/lib/utils";

// aria-hidden: a page names its wait once (its busy region), never per bar.
function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
