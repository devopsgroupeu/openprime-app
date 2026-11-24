import { cn } from "@/lib/utils";

// List gutters 32 px sides and 48 px top (16 / 24 px below md); settings 32 px all round.
const LIST_GUTTERS = "px-4 pt-6 pb-16 md:px-8 md:pt-12";
const WIDTHS = {
  wide: cn("max-w-none", LIST_GUTTERS),
  catalog: cn("max-w-(--content-catalog)", LIST_GUTTERS),
  detail: cn("max-w-(--content-detail)", LIST_GUTTERS),
  prose: cn("max-w-(--content-prose)", LIST_GUTTERS),
  settings: "max-w-(--content-settings) px-4 py-6 md:px-8 md:py-8",
};

/** The content column of every route; widths: wide, catalog, detail, prose, settings. */
export function PageShell({ width = "wide", className, children }) {
  return (
    <div
      data-slot="page-shell"
      data-width={width}
      className={cn(
        "motion-enter mx-auto flex w-full flex-col gap-6",
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
