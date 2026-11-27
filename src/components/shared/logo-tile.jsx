import { createElement, useState } from "react";

import { cn } from "@/lib/utils";

// openprime-ai's IntegrationLogo: xs 16, sm 24, md 36 and lg 48 px.
const SIZES = {
  xs: "size-4 rounded-sm [&_svg]:size-3",
  sm: "size-6 rounded-md [&_svg]:size-3.5",
  md: "size-9 rounded-lg [&_svg]:size-5",
  lg: "size-12 rounded-xl [&_svg]:size-6",
};

// The logo fills about 70 % of the tile.
const LOGO_PAD = { xs: "p-0.5", sm: "p-1", md: "p-1.5", lg: "p-2" };

/**
 * The tile of an official logo (`logo`: a file under public/assets/chart-logos,
 * null = none) with its lucide stand-in (`icon`); props from src/config/logos.js.
 * Logos keep their own colours (never recoloured) on the white `--logo-tile`
 * in both themes; no logo, or one that fails to load, shows the icon on the
 * muted tile. Decorative: the name next to it is the text.
 */
export function LogoTile({ logo, icon, size = "md", className }) {
  const [failed, setFailed] = useState(null);
  const src = logo && logo !== failed ? logo : null;
  return (
    <span
      data-slot="logo-tile"
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center shadow-(--shadow-ring-xs)",
        SIZES[size],
        src
          ? cn("bg-(--logo-tile)", LOGO_PAD[size])
          : "bg-muted text-foreground/80",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          onError={() => setFailed(src)}
          className="size-full object-contain"
        />
      ) : (
        // createElement: the config passes stable module-level icons.
        createElement(icon)
      )}
    </span>
  );
}
