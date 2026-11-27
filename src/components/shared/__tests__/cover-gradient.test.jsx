// Cover gradients are a pure function of the id (openprime-ai
// template-gradient.test.tsx, same hash and pins).
import { render } from "@testing-library/react";

import {
  CoverGradient,
  GRADIENT_COUNT,
  LAYOUT_COUNT,
  coverGradient,
} from "@/components/shared/cover-gradient";

const ids = Array.from({ length: 200 }, (_, i) => `tpl_${i}`);

describe("coverGradient", () => {
  it("maps an id to the same palette and layout every time", () => {
    expect(coverGradient("tpl_writer")).toEqual(coverGradient("tpl_writer"));
    // Pinned to openprime-ai's values: a change of the hash would silently
    // repaint every environment, and an id would no longer match its band
    // in the sister product.
    expect(coverGradient("tpl_writer")).toEqual({ gradient: 7, layout: 2 });
    expect(coverGradient("tpl_analyst")).toEqual({ gradient: 14, layout: 3 });
  });

  it("stays in range and spreads ids over every palette and layout", () => {
    const gradients = new Set();
    const layouts = new Set();
    for (const id of ids) {
      const { gradient, layout } = coverGradient(id);
      expect(gradient).toBeGreaterThanOrEqual(0);
      expect(gradient).toBeLessThan(GRADIENT_COUNT);
      expect(layout).toBeGreaterThanOrEqual(0);
      expect(layout).toBeLessThan(LAYOUT_COUNT);
      gradients.add(gradient);
      layouts.add(layout);
    }
    expect(gradients.size).toBe(GRADIENT_COUNT);
    expect(layouts.size).toBe(LAYOUT_COUNT);
  });

  it("renders a decorative band carrying the palette and layout", () => {
    const { container } = render(
      <CoverGradient id="tpl_writer" className="h-28" />,
    );
    const band = container.querySelector('[data-slot="cover-gradient"]');
    expect(band).toHaveAttribute("aria-hidden", "true");
    expect(band).toHaveAttribute("data-gradient", "7");
    expect(band).toHaveAttribute("data-layout", "2");
    expect(band).toHaveClass("cover-gradient", "h-28");
  });
});
