// Keyboard shortcuts: one definition feeds the handlers, tooltips and the
// shortcuts dialog (port of openprime-ai lib/shortcuts.ts, global ones only).
export const SHORTCUTS = [
  {
    id: "commandPalette",
    label: "Open the command palette",
    mod: true,
    key: "k",
    overridesBrowser: true,
  },
  {
    id: "toggleSidebar",
    label: "Show or hide the sidebar",
    mod: true,
    key: "b",
    overridesBrowser: true,
  },
  {
    id: "shortcutsDialog",
    label: "Show keyboard shortcuts",
    mod: true,
    key: "/",
    overridesBrowser: false,
  },
];

export function shortcut(id) {
  const s = SHORTCUTS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown shortcut ${id}`);
  return s;
}

export function isMac(
  platform = typeof navigator === "undefined" ? "" : navigator.platform,
) {
  return /mac|iphone|ipad/i.test(platform);
}

/** Cmd or Ctrl count as the modifier everywhere, like the sidebar's Cmd/Ctrl+B. */
export function matches(s, e) {
  const mod = e.metaKey || e.ctrlKey;
  if (s.mod !== mod || e.shiftKey || e.altKey) return false;
  return e.key.toLowerCase() === s.key;
}

/** Key labels for <Kbd>, ASCII only ("Cmd", "Ctrl"). */
export function keyLabels(s, mac = isMac()) {
  const keys = [];
  if (s.mod) keys.push(mac ? "Cmd" : "Ctrl");
  keys.push(s.key.toUpperCase());
  return keys;
}
