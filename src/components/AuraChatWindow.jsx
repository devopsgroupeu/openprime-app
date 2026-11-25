// src/components/AuraChatWindow.jsx
// The floating Aura panel: 400 x 560 where the launcher was, full screen on
// phones. It is the content of AuraChatButton's dialog.
import { useRef } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import AuraConversation, {
  AuraHeader,
} from "./modals/ai-chat/AuraConversation";

// A new conversation starts empty; the empty state offers these instead.
export const INITIAL_MESSAGES = [];

const PROMPTS = [
  "Which services does a web app need?",
  "When should I pick Aurora over RDS?",
  "What does Karpenter do?",
];

const AuraChatWindow = ({ messages, setMessages }) => {
  const ref = useRef(null);
  return (
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={undefined}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        ref.current.querySelector("textarea").focus();
      }}
      // Floating beside the page, it stays open while the page is used.
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => {
        // Escape on the page or ending an IME composition is not for Aura.
        if (e.isComposing || !ref.current.contains(e.target)) {
          e.preventDefault();
        }
      }}
      className="fixed inset-0 flex animate-in flex-col bg-popover text-popover-foreground duration-(--dur-base) outline-none fade-in-0 slide-in-from-bottom-2 sm:static sm:h-[min(35rem,calc(100dvh-7rem))] sm:w-100 sm:rounded-xl sm:border sm:shadow-lg"
    >
      <AuraHeader
        titleAs={DialogPrimitive.Title}
        action={
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close Aura">
              <X aria-hidden />
            </Button>
          </DialogPrimitive.Close>
        }
      />
      <AuraConversation
        messages={messages}
        setMessages={setMessages}
        prompts={PROMPTS}
      />
    </DialogPrimitive.Content>
  );
};

export default AuraChatWindow;
