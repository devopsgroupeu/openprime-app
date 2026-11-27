import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// `text-md` (app/ui-tokens.css) joins the font-size group, so the last text size class wins.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["md"] }] } },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Invisible 44 px hit area below md for small controls; text controls use min-h-11 instead. */
export const TOUCH_HIT =
  "relative max-md:before:absolute max-md:before:top-1/2 max-md:before:left-1/2 max-md:before:size-11 max-md:before:-translate-x-1/2 max-md:before:-translate-y-1/2";
