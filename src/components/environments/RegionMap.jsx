import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { providerName } from "../../utils/environmentStats";
import { LAND_PATH } from "./worldLand";

// Equal Earth (Savric, Patterson and Jenny 2018) at scale 100, centered, y down: the units of
// LAND_PATH (d3-geo's geoEqualEarth with the same scale).
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const K = 100;

/** `[x, y]` of a `[longitude, latitude]` in LAND_PATH units. */
export function projectEqualEarth([lon, lat]) {
  const l = (lon * Math.PI) / 180;
  const t = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = t * t;
  const t6 = t2 * t2 * t2;
  const x =
    (l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [K * x, -K * y];
}

// The world without Antarctica and the far north, and the frame's shape.
const [WEST] = projectEqualEarth([-180, 0]);
const NORTH = projectEqualEarth([0, 80])[1];
const SOUTH = projectEqualEarth([0, -58])[1];
const WORLD = { x: WEST, y: NORTH, w: -2 * WEST, h: SOUTH - NORTH };
const ASPECT = 2.6;
const PAD = 28;
const MIN_WIDTH = 130;

// Meridians every 30 degrees (curved) and parallels every 30 (straight).
const GRATICULE = [
  ...Array.from({ length: 13 }, (_, i) => -180 + i * 30).map((lon) =>
    Array.from({ length: 70 }, (_, j) => projectEqualEarth([lon, -58 + j * 2])),
  ),
  ...[-30, 0, 30, 60].map((lat) => [
    projectEqualEarth([-180, lat]),
    projectEqualEarth([180, lat]),
  ]),
]
  .map(
    (line) =>
      `M${line.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}`,
  )
  .join("");

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * The part of the world the regions sit in: their bounds plus padding, at least MIN_WIDTH
 * wide, widened to ASPECT and kept on the map. No point frames the whole world.
 */
export function frameFor(points) {
  if (points.length === 0) {
    return { x: WORLD.x, y: WORLD.y, w: WORLD.w, h: WORLD.w / ASPECT };
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  let w = Math.max(x1 - x0 + 2 * PAD, MIN_WIDTH);
  let h = Math.max(y1 - y0 + 2 * PAD, w / ASPECT);
  w = Math.min(Math.max(w, h * ASPECT), WORLD.w);
  h = w / ASPECT;
  return {
    x: clamp((x0 + x1) / 2 - w / 2, WORLD.x, WORLD.x + WORLD.w - w),
    y: clamp(
      (y0 + y1) / 2 - h / 2,
      WORLD.y,
      Math.max(WORLD.y, WORLD.y + WORLD.h - h),
    ),
    w,
    h,
  };
}

// Dot and halo per cloud once the regions span providers (tokens in index.css);
// a single provider keeps the brand teal.
const ONE = { dot: "bg-chart-1", halo: "bg-chart-1/20" };
const BY_PROVIDER = {
  aws: { dot: "bg-provider-aws", halo: "bg-provider-aws/20" },
  azure: { dot: "bg-provider-azure", halo: "bg-provider-azure/20" },
  gcp: { dot: "bg-provider-gcp", halo: "bg-provider-gcp/20" },
};
export const regionTone = (provider, multi) =>
  (multi && BY_PROVIDER[provider]) || ONE;

// Regions this close (degrees) share a place, like Frankfurt on AWS and Google
// Cloud: their dots sit side by side, SPREAD px apart, instead of on top.
const NEAR = 1.5;
const SPREAD = 12;

/** Each region's horizontal shift in px off its place, 0 when it has the place alone. */
function shifts(regions) {
  const places = [];
  for (const r of regions) {
    const place = places.find(
      ([first]) =>
        Math.abs(first.at[0] - r.at[0]) < NEAR &&
        Math.abs(first.at[1] - r.at[1]) < NEAR,
    );
    if (place) place.push(r);
    else places.push([r]);
  }
  const shift = new Map();
  for (const place of places) {
    place.forEach((r, i) =>
      shift.set(r, (i - (place.length - 1) / 2) * SPREAD),
    );
  }
  return shift;
}

/**
 * The regions in use as dots on an Equal Earth map, framed to where they are. A dot grows
 * with its environments; hover names it (and its provider when there are several, each in
 * its own color). Decorative: the caller lists the regions as text.
 */
export function RegionMap({ regions }) {
  const placed = regions
    .filter((r) => r.at)
    .map((r) => ({ ...r, point: projectEqualEarth(r.at) }));
  const frame = frameFor(placed.map((r) => r.point));
  const multi = new Set(regions.map((r) => r.provider)).size > 1;
  const shift = shifts(placed);
  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden rounded-md bg-muted/40"
      style={{ aspectRatio: ASPECT }}
    >
      <svg
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        className="absolute inset-0 size-full"
      >
        <path
          d={GRATICULE}
          fill="none"
          className="stroke-border"
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
        <path d={LAND_PATH} className="fill-muted-foreground/20" />
      </svg>
      {placed.map((r) => {
        const halo = 12 + 6 * Math.min(r.count - 1, 3);
        const tone = regionTone(r.provider, multi);
        return (
          <Tooltip key={`${r.provider}:${r.region}`}>
            <TooltipTrigger asChild>
              <span
                data-region={r.region}
                data-provider={r.provider}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{
                  left: `${((r.point[0] - frame.x) / frame.w) * 100}%`,
                  top: `${((r.point[1] - frame.y) / frame.h) * 100}%`,
                  marginLeft: shift.get(r) || undefined,
                  width: Math.max(halo, 24),
                  height: Math.max(halo, 24),
                }}
              >
                <span
                  className={cn("absolute rounded-full", tone.halo)}
                  style={{ width: halo, height: halo }}
                />
                <span
                  data-dot
                  className={cn(
                    "relative size-2 rounded-full ring-2 ring-card",
                    tone.dot,
                  )}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {r.name}
              {multi ? ` (${providerName(r.provider)})` : ""}: {r.count}{" "}
              {r.count === 1 ? "environment" : "environments"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
