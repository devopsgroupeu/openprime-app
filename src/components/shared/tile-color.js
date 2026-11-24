/** Tile classes per stored color (the icon tile of cards, pickers and page headers). */
const TILE_COLORS = {
  "chart-1": "bg-chart-1/15 text-chart-1",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5",
};

export const isTileColor = (c) => !!c && Object.hasOwn(TILE_COLORS, c);

// Status tints for tiles that carry a state.
const STATUS_COLORS = {
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
};

/** Tile background + icon color of a stored color; the neutral tile without one. */
export function tileColorClass(color) {
  if (isTileColor(color)) return TILE_COLORS[color];
  if (color && Object.hasOwn(STATUS_COLORS, color)) {
    return STATUS_COLORS[color];
  }
  return "bg-muted text-muted-foreground";
}
