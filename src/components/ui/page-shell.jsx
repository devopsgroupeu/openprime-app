import { cn } from "@/lib/utils";

/**
 * PageShell - the canonical scrollable content column for every page: one
 * width and padding for the whole app, and it owns the scroll container.
 */
export function PageShell({ children, className }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className={cn("mx-auto max-w-6xl px-6 py-10", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
