// src/components/AuraChatButton.jsx
// The floating Aura launcher of the app shell and its window. Both sit under
// every overlay (z-40 < z-50), so they never cover a dialog button. While a
// SaveBar is on screen (it rests at the bottom, see AppLayout) they move up
// above it, clear of Discard and Save; on phones the open window is a modal
// full screen instead. `hidden` (the wizard, which has its own Aura) closes
// the window and takes both out of sight and reach; the conversation stays.
// `greet` (the environments list) shows a greeting above the launcher once.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { AuraMark } from "@/components/shared/aura-mark";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AuraChatWindow, { INITIAL_MESSAGES } from "./AuraChatWindow";

// From sm up the window floats beside the page; below it fills the screen and
// is modal, like a sheet.
const SM_UP = "(min-width: 640px)";
const subscribe = (onChange) => {
  const query = window.matchMedia(SM_UP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const floats = () => window.matchMedia(SM_UP).matches;

const AuraChatButton = ({ hidden = false, greet = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [auraMessages, setAuraMessages] = useState(INITIAL_MESSAGES);
  // What was typed survives closing the window, like the conversation.
  const [draft, setDraft] = useState("");
  const floating = useSyncExternalStore(subscribe, floats);
  // Out of sight means closed: no window, thread or composer left behind.
  if (hidden && isOpen) setIsOpen(false);

  // The greeting: "waiting", "shown", then "done" for as long as the shell
  // is mounted (the page load). Leaving the list or opening Aura ends it.
  const [greeting, setGreeting] = useState("waiting");
  const [held, setHeld] = useState(false);
  const launcherRef = useRef(null);
  if (greeting === "shown" && (!greet || isOpen)) setGreeting("done");

  // About a second after the list renders. Leaving it sooner keeps it
  // waiting for the next visit.
  useEffect(() => {
    if (!greet || greeting !== "waiting") return;
    const timer = setTimeout(() => setGreeting("shown"), 1000);
    return () => clearTimeout(timer);
  }, [greet, greeting]);

  // Gone after 10 s, unless the pointer or focus is on it.
  useEffect(() => {
    if (greeting !== "shown" || held) return;
    const timer = setTimeout(() => setGreeting("done"), 10000);
    return () => clearTimeout(timer);
  }, [greeting, held]);

  // Keyboard users go on from the launcher, not from the top of the page.
  const dismiss = (toLauncher) => {
    setGreeting("done");
    if (toLauncher) launcherRef.current.focus();
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      modal={!floating}
    >
      <div
        hidden={hidden}
        className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6 [body:has([data-slot=save-bar])_&]:bottom-24"
      >
        {greeting === "shown" && (
          // Not announced and never focused by script: the launcher's name
          // already says it. Held like a toast while hovered or focused.
          <div
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={(e) => {
              if (!e.currentTarget.contains(document.activeElement))
                setHeld(false);
            }}
            onFocus={() => setHeld(true)}
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(e.relatedTarget) &&
                !e.currentTarget.matches(":hover")
              )
                setHeld(false);
            }}
            onKeyDown={(e) => e.key === "Escape" && dismiss(true)}
            className="motion-enter relative mb-3 w-72"
          >
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setIsOpen(true)}
              className="w-full rounded-xl border bg-popover px-4 py-3 text-left text-sm text-popover-foreground shadow-lg transition-colors duration-(--dur-fast) outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block font-semibold">Hi, I&apos;m Aura</span>
              <span className="mt-0.5 block text-balance text-muted-foreground">
                Ask me about your environments, AWS services or the generated
                code.
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Dismiss"
              // detail 0: pressed with the keyboard, not clicked.
              onClick={(e) => dismiss(e.detail === 0)}
              className="absolute -top-2 -right-2 rounded-full border bg-popover text-muted-foreground shadow-sm"
            >
              <X aria-hidden />
            </Button>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <DialogPrimitive.Trigger asChild>
              {/* The window takes its place; its header has the one Close. */}
              <Button
                ref={launcherRef}
                hidden={isOpen}
                variant="ghost"
                size="icon"
                aria-label="Ask Aura"
                className="size-12 rounded-full border bg-popover shadow-lg hover:bg-accent active:scale-95"
              >
                <AuraMark className="size-6" />
              </Button>
            </DialogPrimitive.Trigger>
          </TooltipTrigger>
          <TooltipContent side="left">Ask Aura</TooltipContent>
        </Tooltip>

        <AuraChatWindow
          messages={auraMessages}
          setMessages={setAuraMessages}
          draft={draft}
          setDraft={setDraft}
        />
      </div>
    </DialogPrimitive.Root>
  );
};

export default AuraChatButton;
