import { useRef, useState } from "react";

import symbol from "@/assets/openprime-symbol-color.svg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import authService from "../../../services/authService";
import ChatThread from "./ChatThread";
import Composer from "./Composer";

export const AURA_ERROR =
  "Aura couldn't answer right now. Try again in a moment.";

/** Symbol, "Aura" and its one-line status; `action` sits on the right. */
export function AuraHeader({ titleAs: Title = "h2", titleId, action }) {
  return (
    <div className="flex h-13 shrink-0 items-center gap-2.5 border-b pr-2 pl-4">
      <img src={symbol} alt="" className="size-5" />
      <div className="min-w-0 flex-1">
        <Title id={titleId} className="text-sm leading-4 font-medium">
          Aura
        </Title>
        <p className="truncate text-xs text-muted-foreground">
          AI assistant for OpenPrime
        </p>
      </div>
      {action}
    </div>
  );
}

/**
 * The conversation of the floating Aura and the wizard panel: thread, an empty
 * state with suggested prompts (they fill the composer, never send) and the
 * composer. Messages are owned by the caller, so the conversation outlives
 * this component. Streams from POST /ai/chat; `context` rides along when set.
 */
export default function AuraConversation({
  messages,
  setMessages,
  context,
  prompts = [],
  autoFocus = false,
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  // The pending answer lives in the messages, so a remount mid-answer still
  // knows Aura is busy.
  const busy = messages.some((m) => m.pending);

  const send = async () => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      message: input,
      timestamp: new Date(),
    };
    const botId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: botId,
        type: "bot",
        message: "",
        timestamp: new Date(),
        pending: true,
      },
    ]);
    setInput("");

    const update = (patch) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, ...patch } : m)),
      );
    let answer = "";
    try {
      const res = await authService.makeAuthenticatedRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMessage], context }),
      });
      if (!res.ok || !res.body) throw new Error("Aura is unavailable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        decoder
          .decode(value, { stream: true })
          .split("\n")
          .forEach((line) => {
            if (!line.startsWith("data: ")) return;
            try {
              const data = JSON.parse(line.replace(/^data: /, ""));
              if (data.chunk) {
                answer += data.chunk;
                update({ message: answer });
              }
              if (data.done) update({ pending: false });
            } catch {
              /* ignore malformed line */
            }
          });
      }
    } catch (err) {
      console.error(err);
      update({ message: AURA_ERROR, error: true });
    } finally {
      update({ pending: false });
    }
  };

  const fillPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length > 0 ? (
        <ChatThread messages={messages} />
      ) : (
        <div className="flex flex-1 flex-col justify-end gap-3 px-4 pb-1">
          <p className="text-sm text-muted-foreground">
            Ask about AWS services, Terraform or Helm charts.
          </p>
          {prompts.length > 0 ? (
            <ul
              aria-label="Suggested questions"
              // Hidden, not removed, once there is text: nothing jumps.
              className={cn("flex flex-wrap gap-2", input && "invisible")}
            >
              {prompts.map((prompt) => (
                <li key={prompt}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full border px-3 text-xs"
                    onClick={() => fillPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      <div className="shrink-0 p-3">
        <Composer
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSend={send}
          busy={busy}
          placeholder="Ask Aura anything..."
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
}
