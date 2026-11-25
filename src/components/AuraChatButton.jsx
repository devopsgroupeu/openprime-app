// src/components/AuraChatButton.jsx
// The floating Aura launcher of the app shell and its window. Both sit under
// every overlay (z-40 < z-50) and move up while a SaveBar is on screen, so
// they never cover a dialog button or the Save button.
import { useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AuraChatWindow, { INITIAL_MESSAGES } from "./AuraChatWindow";

const AuraChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [auraMessages, setAuraMessages] = useState(INITIAL_MESSAGES);
  const buttonRef = useRef(null);
  const label = isOpen ? "Close Aura" : "Ask Aura";

  const close = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col-reverse items-end gap-3 sm:right-6 sm:bottom-6 [body:has([data-slot=save-bar])_&]:bottom-20">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-expanded={isOpen}
            aria-controls={isOpen ? "aura-window" : undefined}
            onClick={() => setIsOpen((open) => !open)}
            className="size-12 rounded-full border bg-popover text-primary shadow-lg hover:bg-accent hover:text-primary active:scale-95 [&_svg:not([class*='size-'])]:size-5"
          >
            {isOpen ? <X aria-hidden /> : <Sparkles aria-hidden />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>

      {isOpen && (
        <AuraChatWindow
          id="aura-window"
          messages={auraMessages}
          setMessages={setAuraMessages}
          onClose={close}
        />
      )}
    </div>
  );
};

export default AuraChatButton;
