import { IconTile } from "@/components/shared/icon-tile";

/** The one h1 of a page: title, description, status, actions and `menu`; optional tile. */
export function PageHeader({
  title,
  description,
  tile,
  icon: Icon,
  color,
  status,
  actions,
  menu,
}) {
  const resourceTile =
    tile ??
    (Icon ? (
      <IconTile data-slot="resource-tile" icon={Icon} color={color} size="xl" />
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
            <h1 className="text-xl font-semibold text-balance">{title}</h1>
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
