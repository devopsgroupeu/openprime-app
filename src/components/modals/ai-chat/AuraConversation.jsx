import { useRef } from "react";

import { AuraMark } from "@/components/shared/aura-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatThread from "./ChatThread";
import Composer from "./Composer";
import { streamChat } from "./streamChat";

export const AURA_ERROR =
  "Aura couldn't answer right now. Try again in a moment.";

/** Symbol, "Aura" and its one-line status; `action` sits on the right. */
export function AuraHeader({ titleAs: Title = "h2", action }) {
  return (
    <div className="flex h-13 shrink-0 items-center gap-2.5 border-b pr-2 pl-4">
      <AuraMark className="size-5" />
      <div className="min-w-0 flex-1">
        <Title className="text-sm leading-4 font-medium">Aura</Title>
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
 * composer. Messages and the composer's `draft` are owned by the caller, so
 * the conversation outlives this component. Streams from POST /ai/chat;
 * `context` rides along when set.
 */
export default function AuraConversation({
  messages,
  setMessages,
  draft,
  setDraft,
  context,
  prompts = [],
}) {
  const inputRef = useRef(null);
  // The pending answer lives in the messages, so a remount mid-answer still
  // knows Aura is busy and can stop it.
  const pending = messages.find((m) => m.pending);

  // Streams Aura's answer to `history`, which ends with the question.
  const ask = (history) => {
    const botId = Date.now() + 1;
    const update = (patch) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, ...patch } : m)),
      );
    let answer = "";
    const chat = streamChat({ messages: history, context }, (data) => {
      if (data.chunk) {
        answer += data.chunk;
        update({ message: answer });
      }
      if (data.done) update({ pending: false });
    });
    setMessages((prev) => [
      ...prev,
      {
        id: botId,
        type: "bot",
        message: "",
        timestamp: new Date(),
        pending: true,
        stop: chat.stop,
      },
    ]);
    chat.finished.then(
      (end) =>
        update({
          pending: false,
          stop: undefined,
          ...(end !== "done" && { interrupted: end }),
        }),
      (err) => {
        console.error(err);
        update({
          pending: false,
          stop: undefined,
          message: AURA_ERROR,
          error: true,
        });
      },
    );
  };

  const send = () => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      message: draft,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    ask([...messages, userMessage]);
  };

  // The failed answer goes and its question is asked again, same history.
  const retry = () => {
    const history = messages.slice(0, -1);
    setMessages(history);
    ask(history);
  };

  const fillPrompt = (prompt) => {
    setDraft(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length > 0 ? (
        <ChatThread messages={messages} onRetry={retry} />
      ) : (
        <div className="flex flex-1 flex-col justify-end gap-3 px-4 pb-1">
          <p className="text-sm text-muted-foreground">
            Ask about AWS services, Terraform or Helm charts.
          </p>
          {prompts.length > 0 ? (
            <ul
              aria-label="Suggested questions"
              // Hidden, not removed, once there is text: nothing jumps.
              className={cn("flex flex-wrap gap-2", draft && "invisible")}
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
          value={draft}
          onChange={setDraft}
          onSend={send}
          onStop={pending?.stop}
          busy={Boolean(pending)}
          placeholder="Ask Aura anything..."
        />
      </div>
    </div>
  );
}
