import { useEffect, useRef } from "react";

import ChatMessage from "./ChatMessage";

/**
 * The scrolling message list of every Aura surface; `children` render after
 * the messages (the modal's suggested changes). It scrolls itself, never the
 * page, when a message streams in or `children` appear.
 */
const ChatThread = ({ messages, children }) => {
  const ref = useRef(null);
  const hasExtra = Boolean(children);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, hasExtra]);

  return (
    <div
      ref={ref}
      data-slot="chat-thread"
      className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
    >
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
      {children}
    </div>
  );
};

export default ChatThread;
