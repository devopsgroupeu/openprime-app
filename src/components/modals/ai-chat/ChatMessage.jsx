import { Bot, User } from "lucide-react";
import MessageContent from "./MessageContent";

// A single chat bubble (user or AI), extracted from AIChatModal's messages map.
const ChatMessage = ({ message }) => {
  // Check if this is a status message (success/dismiss notifications)
  const isStatusMessage =
    message.type === "ai" &&
    (message.content.startsWith("✅ Configuration applied successfully!") ||
      message.content.startsWith("👍 Suggestion dismissed."));

  return (
    <div
      className={`flex items-start space-x-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
    >
      {/* AI Avatar */}
      {message.type === "ai" && (
        <div
          className={`p-2 rounded-lg shrink-0 ${isStatusMessage ? "bg-success-muted" : "bg-primary-muted"}`}
        >
          <Bot
            className={`w-4 h-4 ${isStatusMessage ? "text-success" : "text-accent"}`}
          />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          message.type === "user"
            ? "bg-primary text-white"
            : isStatusMessage
              ? "bg-success-muted text-success border border-success"
              : "bg-surface text-primary border border-border"
        }`}
      >
        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
          {/* Render HTML content for welcome message, plain text for others */}
          {message.isHtml ? (
            <div
              dangerouslySetInnerHTML={{
                __html: message.content,
              }}
            />
          ) : (
            <MessageContent content={message.content} />
          )}
        </div>
      </div>

      {/* User Avatar */}
      {message.type === "user" && (
        <div className="p-2 bg-background border border-border rounded-lg shrink-0">
          <User className="w-4 h-4 text-tertiary" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
