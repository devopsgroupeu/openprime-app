import { Check, History } from "lucide-react";
import { AuraMark } from "@/components/shared/aura-mark";
import { Button } from "@/components/ui/button";

// The user's locale, on a 24 hour clock: "15:07".
const time = (ms) =>
  new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

/**
 * The wizard's controls at the right end of the shell top bar (WizardPage
 * puts them there with TopBarActions): draft status, the Aura toggles and
 * Cancel. `auraOpen` drives the 2xl column toggle; below 2xl `auraSheet` (a
 * SheetTrigger) opens Aura as a sheet instead. A `draftRestored` wizard says
 * so until the first save and offers `onStartOver`.
 */
export default function WizardActions({
  savedAt,
  draftRestored = false,
  onStartOver,
  auraOpen,
  onToggleAura,
  auraSheet,
  onCancel,
}) {
  return (
    <>
      {savedAt ? (
        <p className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <Check className="size-3.5" aria-hidden />
          Draft saved{" "}
          <time dateTime={new Date(savedAt).toISOString()}>
            {time(savedAt)}
          </time>
        </p>
      ) : draftRestored ? (
        <p className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <History className="size-3.5" aria-hidden />
          Draft restored
        </p>
      ) : null}
      {draftRestored ? (
        <Button variant="ghost" size="sm" onClick={onStartOver}>
          Start over
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={auraOpen}
        onClick={onToggleAura}
        className="hidden aria-pressed:bg-accent aria-pressed:text-accent-foreground 2xl:inline-flex"
      >
        <AuraMark />
        Aura
      </Button>
      {auraSheet}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </>
  );
}
