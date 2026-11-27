import { cn } from "@/lib/utils";

// openprime-ai's TemplateGradient (components/agents/template-gradient.tsx):
// the same hash, palettes and layouts, so an id gets the same band in both
// products. The counts must match the .cover-gradient selectors in
// src/styles/ui-tokens.css.
export const GRADIENT_COUNT = 16;
export const LAYOUT_COUNT = 4;

/** FNV-1a 32-bit hash of a string; stable across runs and engines. */
function hash(value) {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The palette and blob layout of an id. */
export function coverGradient(id) {
  const h = hash(String(id));
  return { gradient: h % GRADIENT_COUNT, layout: (h >>> 8) % LAYOUT_COUNT };
}

/**
 * The decorative gradient band of a resource (the one sanctioned gradient);
 * size it with `className`. Children (an avatar) are decorative too: the band
 * is `aria-hidden`, so never put text or a control on it.
 */
export function CoverGradient({ id, className, children }) {
  const { gradient, layout } = coverGradient(id);
  return (
    <div
      aria-hidden
      data-slot="cover-gradient"
      data-gradient={gradient}
      data-layout={layout}
      className={cn(
        "cover-gradient relative isolate overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
