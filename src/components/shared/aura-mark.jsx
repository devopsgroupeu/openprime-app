import mark from "@/assets/openprime-ai-symbol-color.svg";
import animatedMark from "@/assets/openprime-ai-symbol-color-animated.svg";
import { cn } from "@/lib/utils";

// With reduced motion the browser picks the static mark (the <source>).
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Aura's mark: the OpenPrime AI symbol, the brand's master files copied
 * unchanged (teal on every surface Aura sits on, never recoloured).
 * `thinking` plays the brand's animated symbol while Aura answers.
 * Decorative: the control or the name next to it carries the text. The
 * caller sizes it (default 16 px).
 */
export function AuraMark({ thinking = false, className }) {
  const image = (
    <img
      src={thinking ? animatedMark : mark}
      alt=""
      aria-hidden
      draggable={false}
      data-slot="aura-mark"
      className={cn("size-4 shrink-0 object-contain", className)}
    />
  );
  if (!thinking) return image;
  return (
    <picture className="contents">
      <source media={REDUCED_MOTION} srcSet={mark} />
      {image}
    </picture>
  );
}
