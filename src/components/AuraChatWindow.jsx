// src/components/AuraChatWindow.js
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Minimize2 } from "lucide-react";
import { getApiUrl } from "../utils/envValidator";
import keycloak from "../config/keycloak";

export const INITIAL_MESSAGES = [
  {
    id: 1,
    type: "bot",
    message:
      "Hi there! 👋 I'm Aura, your AI assistant for OpenPrime. I can help you with infrastructure configuration, explain services, and answer questions about your deployments.",
    timestamp: new Date(),
  },
  {
    id: 2,
    type: "bot",
    message:
      "What would you like to know? You can ask me about:\n• AWS, Azure, or GCP services\n• Kubernetes and Helm charts\n• Infrastructure best practices\n• Troubleshooting deployment issues",
    timestamp: new Date(),
  },
];

const AuraChatWindow = ({ onClose, messages, setMessages }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      message: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    const botMessageId = Date.now() + 1;
    let botMessage = {
      id: botMessageId,
      type: "bot",
      message: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);

    try {
      const apiUrl = getApiUrl();
      // POST request to AI chat endpoint
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to AI service");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        chunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace(/^data: /, ""));
              if (data.chunk) {
                botMessage.message += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          message: botMessage.message,
                        }
                      : msg,
                  ),
                );
              }
              if (data.done) setIsTyping(false);
            } catch (err) {
              console.error("Parse error:", err);
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                message: "⚠️ Sorry, I couldn't connect to Aura AI right now.",
              }
            : msg,
        ),
      );
    } finally {
      // Ensure typing indicator is off
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-60">
        <div
          onClick={() => setIsMinimized(false)}
          className="cursor-pointer px-4 py-2 rounded-lg shadow-lg transition-all hover:scale-105 bg-surface border border-border text-primary"
        >
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Aura</span>
            <Sparkles className="w-3 h-3 text-warning" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aura-chat-window fixed bottom-20 right-6 z-60 w-96 h-[500px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 rounded-t-lg border-b bg-surface border-border shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-accent" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-warning animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-primary">Aura AI</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs text-tertiary">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-tertiary hover:text-primary hover:bg-surface-elevated transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-secondary">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs ${msg.type === "user" ? "order-2" : "order-1"}`}
            >
              <div
                className={`flex items-end space-x-2 ${msg.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    msg.type === "user"
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  {msg.type === "user" ? (
                    <User className="w-3 h-3 text-inverse" />
                  ) : (
                    <Bot className="w-3 h-3 text-accent" />
                  )}
                </div>
                <div
                  className={`px-3 py-2 rounded-lg ${
                    msg.type === "user"
                      ? "bg-primary text-inverse"
                      : "bg-surface text-primary border border-border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.type === "user" ? "text-inverse/80" : "text-tertiary"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-surface border border-border">
                <Bot className="w-3 h-3 text-accent" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-surface border border-border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-surface border-border rounded-b-lg shadow-lg">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aura anything about infrastructure..."
            rows={1}
            className="flex-1 px-3 py-2 border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background border-border text-primary placeholder-tertiary focus:border-primary"
            style={{ maxHeight: "80px" }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-3 py-2 rounded-lg transition-all ${
              inputMessage.trim() && !isTyping
                ? "bg-primary text-inverse shadow-md hover:shadow-lg"
                : "bg-background-secondary text-tertiary cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuraChatWindow;
