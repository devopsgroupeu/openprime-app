// Loading skeletons that mirror the loaded layouts (same grids, block sizes and radii), so
// nothing moves when the data arrives; they do not fade in. A page's static header is never a
// skeleton: the page shows it at once, and only what waits for data is here. A text bar fills
// its line box with margins: 16 px (xs) `my-0.5 h-3`, 18 px (sm) `my-0.5 h-3.5`, 24 px (base, or a line
// with a copy button) `my-1 h-4` / `my-1.5 h-3`, 28 px (lg, xl) `my-1 h-5`.
import { PageShell } from "@/components/shared/page-shell";
import { SettingsRowGroup } from "@/components/shared/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { SETTINGS_TABS } from "@/config/nav";
import { cn } from "@/lib/utils";

/** The one busy region of a page, named for what it waits for; its bars are aria-hidden. */
function Busy({ label, className = "flex flex-col gap-6", children }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * A StatCard (compact: one line below sm, value first). `label` and `value` are bar widths like
 * the words they stand for, so a tile wraps where the loaded one does; `children` the picture.
 */
function StatTileSkeleton({ label, value, children }) {
  return (
    <div
      data-slot="stat-card-skeleton"
      className="flex flex-col gap-0.5 rounded-lg bg-card p-2.5 shadow-(--shadow-ring-xs) max-sm:flex-row max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-1.5 max-sm:gap-y-0 max-sm:py-1.5"
    >
      <Skeleton className={cn("my-0.5 h-3", label)} />
      <Skeleton
        className={cn(
          "my-1 h-5 max-sm:order-first max-sm:my-0.5 max-sm:h-4",
          value,
        )}
      />
      {children ? <div className="mt-2.5 max-sm:hidden">{children}</div> : null}
    </div>
  );
}

/** Filter tabs (28 px, 44 px touch targets below md) of the given widths. */
function TabsSkeleton({ widths }) {
  return (
    <div className="flex flex-wrap gap-1">
      {widths.map((width, i) => (
        <Skeleton key={i} className={cn("h-7 rounded-lg max-md:h-11", width)} />
      ))}
    </div>
  );
}

/**
 * A SettingsRow: a title, an optional description and a `control` on the right (under the text
 * below sm). `tall` lines are 24 px: a row with an icon tile or a copy button.
 */
function RowSkeleton({ description = true, tall = false, control }) {
  return (
    <div
      data-slot="row-skeleton"
      className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <div className="flex flex-col gap-0.5">
        <Skeleton
          className={cn(tall ? "my-1.5 h-3" : "my-0.5 h-3.5", "w-32")}
        />
        {description ? (
          <Skeleton
            className={cn(tall ? "my-1.5" : "my-0.5", "h-3 w-56 max-w-full")}
          />
        ) : null}
      </div>
      {control ? <Skeleton className={control} /> : null}
    </div>
  );
}

/** A DetailRow: the label above the value, beside it once the card is 28rem wide. */
function DetailRowSkeleton() {
  return (
    <div className="flex flex-col gap-0.5 px-3.5 py-2.5 @md:min-h-11 @md:flex-row @md:items-center @md:gap-4 @md:py-1.5">
      <Skeleton className="my-0.5 h-3 w-28 @md:h-3.5" />
      <Skeleton className="my-0.5 h-3.5 w-40" />
    </div>
  );
}

/** A wizard service row: icon, name and summary (two lines on a phone), the switch. */
function ServiceRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <Skeleton className="size-8 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Skeleton className="my-0.5 h-3.5 w-32" />
        <Skeleton className="my-0.5 h-3 w-full max-w-64" />
        <Skeleton className="my-0.5 h-3 w-24 md:hidden" />
      </div>
      <Skeleton className="h-4.5 w-8 shrink-0 rounded-full" />
    </div>
  );
}

/** A SettingsSection: its h2, optional description and `action`, then a row group. */
function SectionSkeleton({ description = false, action = null, children }) {
  return (
    <div data-slot="section-skeleton" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Skeleton className="my-1 h-4 w-28" />
          {description ? (
            <Skeleton className="my-0.5 h-3.5 w-64 max-w-full" />
          ) : null}
        </div>
        {action}
      </div>
      <SettingsRowGroup className="@container">{children}</SettingsRowGroup>
    </div>
  );
}

const rows = (count, row) =>
  Array.from({ length: count }, (_, i) => <RowSkeleton key={i} {...row} />);

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

/**
 * The environments list under its header: the stat strip (EnvironmentStatStrip's grid; the
 * pictures are the 104 px of four 20 px rows, the map keeps RegionMap's 2.6 aspect, so a tile
 * grows with the width as the loaded one does), the toolbar (status tabs and count; search and
 * sort, which wrap under the tabs when they do not fit) and cards.
 */
export function ListPageSkeleton() {
  return (
    <Busy label="Loading environments">
      <div className="@container">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 @[59rem]:grid-cols-4">
          <StatTileSkeleton label="w-19" value="w-6">
            <Skeleton className="h-26" />
          </StatTileSkeleton>
          <StatTileSkeleton label="w-12" value="w-6">
            <Skeleton className="h-26" />
          </StatTileSkeleton>
          <StatTileSkeleton label="w-11" value="w-6">
            <Skeleton className="aspect-[2.6]" />
          </StatTileSkeleton>
          <StatTileSkeleton label="w-20" value="w-22">
            <Skeleton className="h-26" />
          </StatTileSkeleton>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <TabsSkeleton widths={["w-12", "w-17", "w-28", "w-17"]} />
          <Skeleton className="my-0.5 h-3 w-21" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-8 rounded-lg sm:w-72" />
          <Skeleton className="h-8 rounded-lg max-md:h-11 sm:w-38.5" />
        </div>
      </div>
      <CardGridSkeleton />
    </Busy>
  );
}

/**
 * The environment page: cover band, header (name and status; region, prefix and modified; the
 * actions, below lg only the primary and the menu), route tabs, and the Overview's tiles,
 * Delivery and first services.
 */
export function DetailPageSkeleton() {
  return (
    <Busy label="Loading environment">
      <div className="flex flex-col gap-4">
        <Skeleton
          data-slot="cover-skeleton"
          className="h-20 rounded-xl sm:h-24"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Skeleton className="my-1 h-5 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Skeleton className="my-0.5 h-3.5 w-40" />
              <Skeleton className="my-1.5 h-3 w-36" />
              <Skeleton className="my-0.5 h-3.5 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Skeleton className="h-8 w-40 rounded-lg max-lg:hidden" />
            <Skeleton className="h-8 w-26 rounded-lg max-lg:hidden" />
            <Skeleton className="h-8 w-16 rounded-lg max-md:h-11" />
            <Skeleton className="size-7" />
          </div>
        </div>
      </div>
      <div className="-mx-4 flex gap-1 border-b px-4 md:mx-0 md:px-0">
        {["w-15", "w-18", "w-23", "w-22"].map((width) => (
          <div key={width} className="flex h-11 items-center px-3 lg:h-13">
            <Skeleton className={cn("h-4", width)} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatTileSkeleton label="w-12" value="w-6" />
        <StatTileSkeleton label="w-16" value="w-6" />
        <StatTileSkeleton label="w-20" value="w-22" />
        <StatTileSkeleton label="w-17" value="w-22" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <SectionSkeleton description>
          {Array.from({ length: 5 }, (_, i) => (
            <DetailRowSkeleton key={i} />
          ))}
        </SectionSkeleton>
        <SectionSkeleton description>{rows(3)}</SectionSkeleton>
      </div>
    </Busy>
  );
}

/**
 * A settings tab under its header (SettingsPage shows that at once): Account's three fields,
 * Preferences' two selects, or the credentials (icon, name and badge; account ID with copy;
 * Test and the menu) under "Add credentials".
 */
export function SettingsPageSkeleton({ tab }) {
  const { label } = SETTINGS_TABS.find((t) => t.id === tab);
  const credentials = tab === "cloud-credentials";
  return (
    <Busy
      label={`Loading ${label.toLowerCase()}`}
      className="flex flex-col gap-3"
    >
      {credentials ? (
        <>
          <SectionSkeleton
            action={<Skeleton className="h-8 w-34 rounded-lg max-md:h-11" />}
          >
            {rows(2, {
              tall: true,
              control: "h-7 w-18.5 rounded-md max-md:h-11",
            })}
          </SectionSkeleton>
          <Skeleton className="my-0.5 h-3 w-72 max-w-full" />
        </>
      ) : (
        <SectionSkeleton>
          {rows(tab === "preferences" ? 2 : 3, {
            description: tab === "preferences",
            control: "h-8 rounded-lg max-md:h-11 sm:w-64",
          })}
        </SectionSkeleton>
      )}
    </Busy>
  );
}

/**
 * The wizard's frame: the stepper (from a 56rem area), the step column (progress line, the
 * step's title and summary, Services' toolbar in an edit, the first section) and the footer.
 * An edit opens on Services; a new environment on Basics, without Back.
 */
export function WizardPageSkeleton({ mode = "edit" }) {
  const edit = mode === "edit";
  return (
    <Busy
      label={edit ? "Loading environment" : "Loading the wizard"}
      className="@container/wizard flex h-full min-h-0 border-t"
    >
      <div
        data-slot="stepper-skeleton"
        className="hidden w-60 shrink-0 flex-col gap-1 border-r px-3 py-6 @4xl/wizard:flex"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 p-2">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <div className="flex flex-col gap-0.5 pt-0.5">
              <Skeleton className="my-0.5 h-3.5 w-20" />
              <Skeleton className="my-0.5 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PageShell width="settings">
            <div className="flex flex-col gap-3">
              <Skeleton className="my-0.5 h-3 w-20 @4xl/wizard:hidden" />
              <div className="flex flex-col gap-1">
                <Skeleton className="my-1 h-5 w-28" />
                {/* The summary takes two lines on a phone. */}
                <div className="flex flex-col">
                  <Skeleton className="my-0.5 h-3.5 w-full max-w-md" />
                  <Skeleton className="my-0.5 h-3.5 w-40 sm:hidden" />
                </div>
              </div>
            </div>
            {edit ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="h-8 rounded-lg sm:w-72" />
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="my-0.5 h-3.5 w-24" />
                    <Skeleton className="size-7" />
                  </div>
                </div>
                <TabsSkeleton
                  widths={[
                    "w-8.5",
                    "w-21",
                    "w-18",
                    "w-20",
                    "w-18",
                    "w-16",
                    "w-17",
                  ]}
                />
              </div>
            ) : null}
            <SectionSkeleton>
              {edit
                ? Array.from({ length: 3 }, (_, i) => (
                    <ServiceRowSkeleton key={i} />
                  ))
                : rows(2, { control: "h-8 rounded-lg max-md:h-11 sm:w-64" })}
            </SectionSkeleton>
          </PageShell>
        </div>
        <footer className="shrink-0 border-t bg-background">
          <div className="mx-auto flex w-full max-w-(--content-settings) items-center gap-3 px-4 py-3 md:px-8">
            {edit ? (
              <Skeleton className="h-8 w-12.5 rounded-lg max-md:h-11" />
            ) : null}
            <Skeleton className="ml-auto h-8 w-19 rounded-lg max-md:h-11" />
          </div>
        </footer>
      </div>
    </Busy>
  );
}
