import { readFileSync } from "node:fs";

// WCAG AA guard for the color tokens of index.css and ui-tokens.css (port of
// openprime-ai app/tokens-contrast.test.ts, without its workspace brand
// presets): 4.5:1 text, 3:1 boundaries and marks.

const css = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

/** Declarations of the first rule whose selector is exactly `selector`. */
function block(source, selector) {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no ${selector} rule`);
  const body = source.slice(start, source.indexOf("}", start));
  const out = {};
  for (const [, name = "", value = ""] of body.matchAll(
    /--([\w-]+):\s*([^;]+);/g,
  )) {
    const rgb = parseColor(value.trim());
    if (rgb) out[name] = rgb;
  }
  return out;
}

function parseColor(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1] ?? "", 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const lch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
  return lch
    ? oklchToSrgb(Number(lch[1]), Number(lch[2]), Number(lch[3]))
    : null;
}

// OKLCH -> OKLab -> linear sRGB -> gamma sRGB (Bjorn Ottosson's matrices), clamped to gamut.
function oklchToSrgb(l, c, h) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707612701 * s_,
  ];
  const gamma = (x) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  return linear.map((x) => Math.min(1, Math.max(0, gamma(x))));
}

/** A token the test reads must exist; a missing one is a failure, not a silent 0. */
function need(color) {
  if (!color) throw new Error("token missing");
  return color;
}

function luminance(color) {
  const [r, g, b] = need(color);
  const lin = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `fg` painted at `alpha` over `bg` (Tailwind's `bg-x/10` composite). */
function over(fg, bg, alpha) {
  const back = need(bg);
  return need(fg).map((v, i) => v * alpha + back[i] * (1 - alpha));
}

const globals = css("../../index.css");
const uiTokens = css("../ui-tokens.css");

const themes = {
  light: { ...block(globals, ":root"), ...block(uiTokens, ":root") },
  dark: { ...block(globals, ".dark"), ...block(uiTokens, ".dark") },
};

const TEXT = 4.5;
const NON_TEXT = 3;

describe.each(Object.entries(themes))("%s theme tokens", (theme, t) => {
  const pairs = [
    ["foreground", "background", TEXT],
    ["foreground", "card", TEXT],
    ["foreground", "popover", TEXT],
    ["muted-foreground", "background", TEXT],
    ["muted-foreground", "card", TEXT],
    ["muted-foreground", "popover", TEXT],
    ["muted-foreground", "muted", TEXT],
    ["accent-foreground", "accent", TEXT],
    ["secondary-foreground", "secondary", TEXT],
    ["primary-foreground", "primary", TEXT],
    ["primary", "background", TEXT],
    ["primary", "card", TEXT],
    ["destructive", "background", TEXT],
    ["destructive", "card", TEXT],
    ["destructive", "popover", TEXT],
    ["input", "background", NON_TEXT],
    ["input", "card", NON_TEXT],
    ["input", "popover", NON_TEXT],
    ["ring", "background", NON_TEXT],
    ["ring", "card", NON_TEXT],
    ["ring", "popover", NON_TEXT],
    ["info-foreground", "info", TEXT],
    ["warning-foreground", "warning", TEXT],
    ["sidebar-foreground", "sidebar", TEXT],
    ["sidebar-accent-foreground", "sidebar-accent", TEXT],
    ["sidebar-primary-foreground", "sidebar-primary", TEXT],
    ["sidebar-primary", "sidebar", NON_TEXT],
    ["sidebar-ring", "sidebar", NON_TEXT],
    ["sidebar-ring", "sidebar-accent", NON_TEXT],
    ...[1, 2, 3, 4, 5].flatMap((n) => [
      [`chart-${n}`, "background", NON_TEXT],
      [`chart-${n}`, "card", NON_TEXT],
    ]),
  ];
  if (theme === "light")
    pairs.push(["destructive-foreground", "destructive", TEXT]);

  it.each(pairs)("%s on %s >= %s:1", (fg, bg, min) => {
    expect(t[fg], fg).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
  });

  it.each(["info", "warning"])(
    "text-%s stays AA on its own 10 %% tint",
    (hue) => {
      for (const surface of ["background", "card"]) {
        const tint = over(t[hue], t[surface], 0.1);
        expect(
          contrast(t[hue], tint),
          `${hue} on ${surface}`,
        ).toBeGreaterThanOrEqual(TEXT);
        expect(contrast(t.foreground, tint)).toBeGreaterThanOrEqual(TEXT);
      }
    },
  );

  it("temporary chat page tint (bg-info/5, dark /10) keeps body and muted text AA", () => {
    const tint = over(t.info, t.background, theme === "dark" ? 0.1 : 0.05);
    expect(contrast(t.foreground, tint)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(t["muted-foreground"], tint)).toBeGreaterThanOrEqual(TEXT);
  });

  it.each([1, 2, 3, 4, 5])(
    "chart-%s icon stays >= 3:1 on its 15 %% tile",
    (n) => {
      const c = t[`chart-${n}`];
      expect(contrast(c, over(c, t.card, 0.15))).toBeGreaterThanOrEqual(
        NON_TEXT,
      );
    },
  );

  it("sidebar labels and badges are readable on the sidebar and its hover row", () => {
    const fg = t["sidebar-foreground"];
    for (const surface of [t.sidebar, t["sidebar-accent"]]) {
      // text-sidebar-foreground/70 (section labels, meta).
      expect(contrast(over(fg, surface, 0.7), surface)).toBeGreaterThanOrEqual(
        TEXT,
      );
    }
    // Count badge: text-sidebar-foreground on bg-sidebar-foreground/15.
    expect(contrast(fg, over(fg, t.sidebar, 0.15))).toBeGreaterThanOrEqual(
      TEXT,
    );
  });

  it("sidebar is the brand green, not grey", () => {
    const [r, g, b] = need(t.sidebar);
    expect(g - r).toBeGreaterThan(0.1);
    expect(b - r).toBeGreaterThan(0.08);
  });

  it("hover row is a visible step above the sidebar", () => {
    expect(contrast(t["sidebar-accent"], t.sidebar)).toBeGreaterThanOrEqual(
      1.2,
    );
  });
});

describe("elevation steps", () => {
  it("dark: background < card < popover < accent, each a visible step", () => {
    const { background, card, popover, accent } = themes.dark;
    expect(contrast(card, background)).toBeGreaterThanOrEqual(1.1);
    expect(luminance(popover)).toBeGreaterThan(luminance(card));
    expect(contrast(accent, popover)).toBeGreaterThanOrEqual(1.2);
  });

  it("light: card is lighter than the page, hover darker than the card", () => {
    const { background, card, accent } = themes.light;
    expect(luminance(card)).toBeGreaterThan(luminance(background));
    expect(contrast(accent, card)).toBeGreaterThanOrEqual(1.1);
  });

  it("dark info tint reads blue, not grey", () => {
    const { info, background } = themes.dark;
    const [r, , b] = over(info, background, 0.1);
    expect(b - r).toBeGreaterThanOrEqual(0.06);
  });
});
