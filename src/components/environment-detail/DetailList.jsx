import { Link } from "react-router";
import { Button } from "@/components/ui/button";

/**
 * Read-only facts in a divided ring card (the SettingsRowGroup look). Rows put
 * the label beside the value when the card is at least 28rem wide, above it
 * when narrower (a phone, a half-width column).
 */
export function DetailList({ children }) {
  return (
    <dl className="@container divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset">
      {children}
    </dl>
  );
}

/** One fact: label, value and optional `actions` (copy, open) at the end. */
export function DetailRow({ label, children, actions }) {
  return (
    <div className="flex flex-col gap-0.5 px-3.5 py-2.5 @md:min-h-11 @md:flex-row @md:items-center @md:gap-4 @md:py-1.5">
      <dt className="text-xs text-muted-foreground @md:w-44 @md:shrink-0 @md:text-sm">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? (
          <div className="-my-1 flex shrink-0 items-center gap-0.5">
            {actions}
          </div>
        ) : null}
      </dd>
    </div>
  );
}

/** A technical value: mono, one line, full text on hover. */
export function Mono({ children, title }) {
  return (
    <p className="truncate font-mono text-xs" title={title ?? children}>
      {children}
    </p>
  );
}

/** "Not configured" + a Configure link to the wizard. */
export function NotConfigured({ editHref }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">Not configured</span>
      <Button variant="ghost" size="xs" asChild>
        <Link to={editHref}>Configure</Link>
      </Button>
    </span>
  );
}
