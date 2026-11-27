import { IconTile } from "@/components/shared/icon-tile";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";

/**
 * The one h1 of a page: title, description, status, actions and `menu`; optional tile. The tab
 * reads "`documentTitle` - OpenPrime" (default: the title). With `headingRef` the h1 takes focus
 * from script (the wizard moves it there on a step change).
 */
export function PageHeader({
  title,
  documentTitle = title,
  description,
  tile,
  icon: Icon,
  status,
  actions,
  menu,
  headingRef,
}) {
  useDocumentTitle(documentTitle);
  const resourceTile =
    tile ??
    (Icon ? (
      <IconTile data-slot="resource-tile" icon={Icon} size="xl" />
    ) : null);
  return (
    <header
      data-slot="page-header"
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        {resourceTile}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              ref={headingRef}
              tabIndex={headingRef ? -1 : undefined}
              className={cn(
                "text-xl font-semibold text-balance",
                headingRef && "outline-none",
              )}
            >
              {title}
            </h1>
            {status}
          </div>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions || menu ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
          {menu}
        </div>
      ) : null}
    </header>
  );
}
