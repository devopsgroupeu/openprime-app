// src/components/AuraChatWindow.jsx
// The floating Aura panel: 400 x 560 above the launcher, full screen on phones.
import { X } from "lucide-react";

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

const AuraChatWindow = ({ id, onClose, messages, setMessages }) => (
  <section
    id={id}
    aria-labelledby="aura-window-title"
    onKeyDown={(e) => {
      if (e.key === "Escape") onClose();
    }}
    className="fixed inset-0 flex animate-in flex-col bg-popover text-popover-foreground duration-(--dur-base) fade-in-0 slide-in-from-bottom-2 sm:static sm:h-[min(35rem,calc(100dvh-7rem))] sm:w-100 sm:rounded-xl sm:border sm:shadow-lg"
  >
    <AuraHeader
      titleId="aura-window-title"
      action={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close Aura"
          onClick={onClose}
        >
          <X aria-hidden />
        </Button>
      }
    />
    <AuraConversation
      messages={messages}
      setMessages={setMessages}
      prompts={PROMPTS}
      autoFocus
    />
  </section>
);

export default AuraChatWindow;
