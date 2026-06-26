// src/components/WizardAssistant.jsx
// Inline AI assistant for the wizard's right column. Streams from the same /ai/chat
// endpoint as the floating Aura window, but embedded (no float/minimize chrome).
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { getApiUrl } from "../utils/envValidator";
import keycloak from "../config/keycloak";

const INTRO = [
  {
    id: 1,
    type: "bot",
    message:
      "Hi! I'm Aura 👋 Ask me anything while you configure this environment — which services you need, regions, Helm charts, or infrastructure best practices.",
    timestamp: new Date(),
  },
];

const WizardAssistant = ({ context }) => {
  const [messages, setMessages] = useState(INTRO);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = {
      id: Date.now(),
      type: "user",
      message: input,
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsTyping(true);

    const botId = Date.now() + 1;
    const bot = { id: botId, type: "bot", message: "", timestamp: new Date() };
    setMessages((p) => [...p, bot]);

    try {
      const res = await fetch(`${getApiUrl()}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], context }),
      });
      if (!res.ok || !res.body) throw new Error("AI unavailable");

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
                bot.message += data.chunk;
                setMessages((p) =>
                  p.map((m) =>
                    m.id === botId ? { ...m, message: bot.message } : m,
                  ),
                );
              }
              if (data.done) setIsTyping(false);
            } catch {
              /* ignore malformed line */
            }
          });
      }
    } catch {
      setMessages((p) =>
        p.map((m) =>
          m.id === botId
            ? { ...m, message: "⚠️ Aura is unavailable right now." }
            : m,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-overlay">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3">
        <span className="relative">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
            <Bot className="h-4 w-4 text-accent" />
          </span>
          <Sparkles className="absolute -right-1 -top-1 h-3 w-3 animate-pulse text-warning" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-primary">Aura Assistant</h3>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[10px] text-tertiary">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[85%] items-end gap-2 ${
                m.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  m.type === "user"
                    ? "bg-primary"
                    : "border border-border bg-surface"
                }`}
              >
                {m.type === "user" ? (
                  <User className="h-3 w-3 text-inverse" />
                ) : (
                  <Bot className="h-3 w-3 text-accent" />
                )}
              </span>
              <div
                className={`rounded-lg px-3 py-2 ${
                  m.type === "user"
                    ? "bg-primary text-inverse"
                    : "border border-border bg-surface text-primary"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">
                  {m.message || "…"}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface">
                <Bot className="h-3 w-3 text-accent" />
              </span>
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask Aura…"
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none"
            style={{ maxHeight: "80px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className={`rounded-lg px-3 py-2 transition-all ${
              input.trim() && !isTyping
                ? "bg-primary text-inverse"
                : "cursor-not-allowed bg-background-secondary text-tertiary"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WizardAssistant;
