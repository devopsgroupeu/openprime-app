import { createElement } from "react";

import { cn } from "@/lib/utils";

// The one icon tile, 16 to 56 px.
const SIZES = {
  xs: "size-4 rounded-sm [&_svg]:size-3",
  sm: "size-5 rounded-md [&_svg]:size-3.5",
  menu: "size-6 rounded-md [&_svg]:size-3.5",
  md: "size-7 rounded-md [&_svg]:size-4",
  lg: "size-8 rounded-lg [&_svg]:size-4",
  row: "size-9 rounded-lg [&_svg]:size-5",
  xl: "size-10 rounded-lg [&_svg]:size-5",
  "2xl": "size-14 rounded-xl [&_svg]:size-7",
};

/**
 * A neutral `bg-muted` tile around a concept icon (`icon`) or other content
 * (`children`). PageHeader, list rows and the environment cover's avatar use
 * it. Decorative unless `aria-label` is set.
 */
export function IconTile({ icon, children, size = "lg", className, ...props }) {
  return (
    <span
      data-slot="icon-tile"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden select-none",
        SIZES[size],
        "bg-muted text-muted-foreground",
        className,
      )}
    >
      {/* createElement: callers pass stable module-level registry components. */}
      {icon ? createElement(icon, { "aria-hidden": true }) : children}
    </span>
  );
}
