import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SHORTCUTS, keyLabels } from "@/lib/shortcuts";

/** Reads lib/shortcuts.js (one definition feeds the dialog and the handlers). */
export default function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Cmd on macOS, Ctrl on Windows and Linux.
          </DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col divide-y">
          {SHORTCUTS.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 py-2"
            >
              <dt className="text-sm">
                {s.label}
                {s.overridesBrowser ? (
                  <span className="block text-xs text-muted-foreground">
                    Replaces a browser shortcut
                  </span>
                ) : null}
              </dt>
              <dd>
                <KbdGroup>
                  {keyLabels(s).map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </KbdGroup>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
