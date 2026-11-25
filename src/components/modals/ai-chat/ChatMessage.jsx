import { Ban, Check, CircleAlert, RotateCcw } from "lucide-react";

import symbol from "@/assets/openprime-symbol-color.svg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MessageContent from "./MessageContent";

// How an answer that ended early reads (`interrupted`).
export const INTERRUPTED = {
  stopped: "You stopped this answer.",
  timeout: "Aura took too long to answer.",
};

/** A one-line notice in a turn: errors and "Configuration applied." */
function Marker({ icon: Icon, tone = "muted", action, children }) {
  return (
    <div
      data-slot="marker"
      data-tone={tone}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap",
        tone === "destructive"
          ? "border-destructive/40 bg-destructive/5 text-foreground [&>svg]:text-destructive"
          : "bg-muted/40 text-muted-foreground",
      )}
    >
      <Icon aria-hidden className="mt-px size-4 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}

/**
 * One chat turn, the only message renderer of the Aura surfaces. User turns
 * are a right-aligned bubble; Aura's are plain text under its name. Aura
 * messages carry `message`, the AI modal's `content`; `pending` (no text yet)
 * shows "Thinking", `error`, `interrupted` and `tone: "status"` show a marker.
 * `onRetry` adds "Try again" to a failed answer.
 */
const ChatMessage = ({ message, onRetry }) => {
  const text = message.content ?? message.message ?? "";

  if (message.type === "user") {
    return (
      <article data-slot="message" className="flex flex-col items-end">
        <h3 className="sr-only">You said</h3>
        <div className="max-w-[85%] rounded-xl bg-secondary px-3.5 py-2 text-sm break-words whitespace-pre-wrap text-secondary-foreground">
          {text}
        </div>
      </article>
    );
  }

  const retry = onRetry ? (
    <Button size="xs" variant="outline" className="-my-0.5" onClick={onRetry}>
      <RotateCcw aria-hidden />
      Try again
    </Button>
  ) : null;

  let body;
  if (message.error) {
    body = (
      <Marker icon={CircleAlert} tone="destructive" action={retry}>
        {text}
      </Marker>
    );
  } else if (message.tone === "status") {
    body = <Marker icon={Check}>{text}</Marker>;
  } else if (!text && message.pending) {
    body = (
      <p role="status" className="animate-pulse text-sm text-muted-foreground">
        Thinking
      </p>
    );
  } else {
    body = (
      <>
        {text ? (
          <div className="w-full min-w-0 text-sm break-words whitespace-pre-wrap">
            <MessageContent content={text} />
          </div>
        ) : null}
        {message.interrupted ? (
          <Marker
            icon={message.interrupted === "timeout" ? CircleAlert : Ban}
            tone={message.interrupted === "timeout" ? "destructive" : "muted"}
            action={retry}
          >
            {INTERRUPTED[message.interrupted]}
          </Marker>
        ) : null}
      </>
    );
  }

  return (
    <article data-slot="message" className="flex flex-col items-start gap-1.5">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <img src={symbol} alt="" className="size-4" />
        Aura
      </h3>
      {body}
    </article>
  );
};

export default ChatMessage;
