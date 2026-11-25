import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** The dirty form's confirm; shell navigation (palette, shortcuts) asks it. */
const registered = { confirm: null };

/**
 * Runs `go` now, or after the user confirmed leaving the dirty form (non-link navigation).
 * `to`, the target path, skips the question when the form stays on screen there.
 */
export function guardedNavigate(go, to) {
  if (registered.confirm) registered.confirm(go, to);
  else go();
}

/**
 * Dirty-form guard: `beforeunload`, in-app link clicks and every `guardedNavigate` call.
 * `within`: a path prefix the form stays mounted under (the settings tabs); moves there keep it.
 */
export function useUnsavedGuard(dirty, { within } = {}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    // Nothing left to lose (saved, the job ended): an open prompt goes away.
    if (!dirty) {
      setPending(null);
      return;
    }
    // Paths that keep the form and its edits: this page (another ?tab= or
    // filter; the router's path, so it holds under any router) or, with
    // `within`, every path under it.
    const keeps = (path) =>
      within ? path.startsWith(within) : path === pathname;
    const confirm = (go, to) => {
      if (to && keeps(new URL(to, window.location.href).pathname)) go();
      else setPending({ go });
    };
    registered.confirm = confirm;
    const onBeforeUnload = (e) => e.preventDefault();
    const onClick = (e) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;
      const anchor = e.target?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank")
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (keeps(url.pathname)) return;
      e.preventDefault();
      e.stopPropagation();
      const href = `${url.pathname}${url.search}${url.hash}`;
      confirm(() => navigate(href));
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      if (registered.confirm === confirm) registered.confirm = null;
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, navigate, pathname, within]);

  return {
    pending: pending !== null,
    stay: () => setPending(null),
    leave: () => {
      setPending(null);
      pending?.go();
    },
  };
}

/**
 * Sticky save bar of multi-field forms: Discard and Save when dirty; guards navigation.
 * `label` says where the edits are when they are not on screen.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  within,
  label = "Unsaved changes",
}) {
  const guard = useUnsavedGuard(dirty, { within });
  return (
    <>
      {dirty ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          data-slot="save-bar"
          // A floating bar at the bottom of the content column (mt-auto: of
          // a column that fills the screen, also on a short page).
          className="motion-enter sticky bottom-4 z-20 mx-auto mt-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-card py-2 pr-2 pl-4 shadow-xl"
        >
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Spinner aria-hidden /> : null}
              Save
            </Button>
          </div>
        </div>
      ) : null}
      <AlertDialog
        open={guard.pending}
        onOpenChange={(o) => !o && guard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes on this page will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={guard.leave}>
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
