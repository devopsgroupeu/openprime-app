// src/components/AuraChatButton.jsx
// The floating Aura launcher of the app shell and its window. Both sit under
// every overlay (z-40 < z-50), so they never cover a dialog button. While a
// SaveBar is on screen (it rests at the bottom, see AppLayout) they move up
// above it, clear of Discard and Save; on phones the open window is a modal
// full screen instead.
import { useState, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

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

const AuraChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [auraMessages, setAuraMessages] = useState(INITIAL_MESSAGES);
  // What was typed survives closing the window, like the conversation.
  const [draft, setDraft] = useState("");
  const floating = useSyncExternalStore(subscribe, floats);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      modal={!floating}
    >
      <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6 [body:has([data-slot=save-bar])_&]:bottom-24">
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogPrimitive.Trigger asChild>
              {/* The window takes its place; its header has the one Close. */}
              <Button
                hidden={isOpen}
                variant="ghost"
                size="icon"
                aria-label="Ask Aura"
                className="size-12 rounded-full border bg-popover text-primary shadow-lg hover:bg-accent hover:text-primary active:scale-95 [&_svg:not([class*='size-'])]:size-5"
              >
                <Sparkles aria-hidden />
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
