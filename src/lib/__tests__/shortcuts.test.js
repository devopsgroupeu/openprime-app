import {
  SHORTCUTS,
  isMac,
  keyLabels,
  matches,
  shortcut,
} from "@/lib/shortcuts";

const key = (k, mods = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe("shortcuts", () => {
  it("defines the palette, sidebar and shortcuts dialog", () => {
    expect(SHORTCUTS.map((s) => s.id)).toEqual([
      "commandPalette",
      "toggleSidebar",
      "shortcutsDialog",
    ]);
  });

  // Cmd+K (Firefox web search) and Cmd+B (Firefox bookmarks) replace a
  // browser shortcut, so the dialog must say so.
  it("marks the combos that replace a browser shortcut", () => {
    expect(shortcut("commandPalette").overridesBrowser).toBe(true);
    expect(shortcut("toggleSidebar").overridesBrowser).toBe(true);
    expect(shortcut("shortcutsDialog").overridesBrowser).toBe(false);
  });

  it("never takes close tab, new tab or new window", () => {
    for (const k of ["w", "t", "n"]) {
      expect(SHORTCUTS.some((s) => s.mod && s.key === k)).toBe(false);
    }
  });

  it("throws on an unknown id", () => {
    expect(() => shortcut("nope")).toThrow("unknown shortcut nope");
  });

  it("matches Cmd or Ctrl, ignores case, and rejects Shift or Alt", () => {
    const palette = shortcut("commandPalette");
    expect(matches(palette, key("k", { metaKey: true }))).toBe(true);
    expect(matches(palette, key("K", { ctrlKey: true }))).toBe(true);
    expect(matches(palette, key("k"))).toBe(false);
    expect(matches(palette, key("k", { metaKey: true, shiftKey: true }))).toBe(
      false,
    );
    expect(matches(palette, key("k", { ctrlKey: true, altKey: true }))).toBe(
      false,
    );
    expect(matches(palette, key("j", { metaKey: true }))).toBe(false);
  });

  it("labels the modifier Cmd on macOS and Ctrl elsewhere", () => {
    const palette = shortcut("commandPalette");
    expect(keyLabels(palette, true)).toEqual(["Cmd", "K"]);
    expect(keyLabels(palette, false)).toEqual(["Ctrl", "K"]);
    expect(isMac("MacIntel")).toBe(true);
    expect(isMac("iPhone")).toBe(true);
    expect(isMac("Win32")).toBe(false);
  });
});
