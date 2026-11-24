/**
 * EmptyState - the one empty-list block: icon in a muted tile, title,
 * description and a single call to action.
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-dashed bg-card/40 p-6 text-center text-balance md:p-12">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        {Icon && (
          <div className="mb-2 flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/50 [&_svg]:size-6">
            <Icon />
          </div>
        )}
        <div className="text-lg font-semibold tracking-[-0.01em]">{title}</div>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance">
          {action}
        </div>
      )}
    </div>
  );
}
