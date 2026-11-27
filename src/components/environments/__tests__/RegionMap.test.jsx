import { render } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RegionMap, frameFor, projectEqualEarth } from "../RegionMap";

describe("projectEqualEarth", () => {
  // Reference points from d3-geo geoEqualEarth().scale(100).translate([0, 0]),
  // the projection LAND_PATH was drawn with.
  it.each([
    [
      [8.68, 50.11],
      [10.757, -94.328],
    ],
    [
      [-77.49, 39.04],
      [-103.887, -75.775],
    ],
    [
      [151.21, -33.87],
      [208.71, 66.471],
    ],
  ])("puts %j where d3-geo does", (point, [x, y]) => {
    const [px, py] = projectEqualEarth(point);
    expect(px).toBeCloseTo(x, 2);
    expect(py).toBeCloseTo(y, 2);
  });
});

describe("frameFor", () => {
  const inside = (frame, [x, y]) =>
    x > frame.x &&
    x < frame.x + frame.w &&
    y > frame.y &&
    y < frame.y + frame.h;

  it("frames the regions with room around them, at the tile's shape", () => {
    const points = [
      [8.68, 50.11],
      [-77.49, 39.04],
    ].map(projectEqualEarth);
    const frame = frameFor(points);
    expect(frame.w / frame.h).toBeCloseTo(2.6, 5);
    for (const point of points) expect(inside(frame, point)).toBe(true);
  });

  it("keeps one region in a frame wider than a single country", () => {
    expect(
      frameFor([projectEqualEarth([8.68, 50.11])]).w,
    ).toBeGreaterThanOrEqual(130);
  });

  it("shows the whole world without a region", () => {
    expect(frameFor([]).w).toBeCloseTo(-2 * projectEqualEarth([-180, 0])[0], 5);
  });
});

describe("RegionMap", () => {
  it("draws a dot for every region with a place, none for the rest", () => {
    const { container } = render(
      <TooltipProvider>
        <RegionMap
          regions={[
            {
              region: "eu-west-1",
              name: "Europe (Ireland)",
              city: "Ireland",
              at: [-6.26, 53.35],
              count: 2,
            },
            {
              region: "xx-test-9",
              name: "xx-test-9",
              city: "xx-test-9",
              at: null,
              count: 1,
            },
          ]}
        />
      </TooltipProvider>,
    );
    expect(
      [...container.querySelectorAll("[data-region]")].map(
        (el) => el.dataset.region,
      ),
    ).toEqual(["eu-west-1"]);
  });
});
