// Overlay wrappers return focus on close to the element focused before (menu items skipped).
import { useRef } from "react";

let lastFocused = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (
        el instanceof HTMLElement &&
        !el.closest('[role="menu"], [role="listbox"]')
      ) {
        lastFocused = el;
      }
    },
    true,
  );
}

/** Merges the focus-return handlers into an overlay content's own ones. */
export function useFocusReturn(own) {
  const opener = useRef(null);
  return {
    onOpenAutoFocus: (event) => {
      opener.current = lastFocused;
      own.onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: (event) => {
      own.onCloseAutoFocus?.(event);
      const el = opener.current;
      opener.current = null;
      if (event.defaultPrevented || !el?.isConnected) return;
      event.preventDefault();
      el.focus();
    },
  };
}
