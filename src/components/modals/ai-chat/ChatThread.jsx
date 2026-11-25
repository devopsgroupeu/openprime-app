import { useEffect, useRef, useState } from "react";

import ChatMessage, { INTERRUPTED } from "./ChatMessage";

// What a screen reader hears once an answer settles. Code blocks are left
// out: read aloud, a fence and its code are noise.
const announcement = (message) => {
  const text = message.content ?? message.message ?? "";
  if (message.error) return text;
  if (message.interrupted) return INTERRUPTED[message.interrupted];
  const prose = text.replace(/```[\s\S]*?(?:```|$)/g, "").trim();
  return prose ? `Aura answered: ${prose.slice(0, 150)}` : "Aura answered.";
};

/**
 * The scrolling message list of every Aura surface; `children` render after
 * the messages (the modal's suggested changes). It scrolls itself, never the
 * page, when a message streams in or `children` appear. A failed last answer
 * offers `onRetry`. The thread is not live; a polite status line says when an
 * answer is done (with its start) or why it failed.
 */
const ChatThread = ({ messages, onRetry, children }) => {
  const ref = useRef(null);
  const hasExtra = Boolean(children);
  const last = messages.at(-1);
  const failed = last?.error || last?.interrupted ? last : null;
  const busy = messages.some((m) => m.pending);
  const [seen, setSeen] = useState({ busy, failed });
  const [said, setSaid] = useState("");
  if (busy !== seen.busy || failed !== seen.failed) {
    setSeen({ busy, failed });
    // Cleared while Aura answers, so the same words are announced again.
    if (busy !== seen.busy) setSaid(busy ? "" : announcement(last));
    // A question that failed before it was sent had no answer in flight.
    else if (failed) setSaid(announcement(failed));
  }

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, hasExtra]);

  return (
    <>
      <div
        ref={ref}
        data-slot="chat-thread"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
      >
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            message={m}
            onRetry={m === failed ? onRetry : undefined}
          />
        ))}
        {children}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  );
};

export default ChatThread;
