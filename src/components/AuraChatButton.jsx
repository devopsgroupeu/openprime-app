// src/components/AuraChatButton.js
import { useState } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import AuraChatWindow, { INITIAL_MESSAGES } from "./AuraChatWindow";

const AuraChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [auraMessages, setAuraMessages] = useState(INITIAL_MESSAGES);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <AuraChatWindow
          messages={auraMessages}
          setMessages={setAuraMessages}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-60">
        <button
          onClick={toggleChat}
          className={`aura-chat-button relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 bg-primary hover:bg-openprime-gradient focus:ring-primary/50 ${isOpen ? "rotate-180" : ""}`}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-pulse"></div>

          {/* Icon */}
          <div className="relative flex items-center justify-center w-full h-full">
            {isOpen ? (
              <X className="w-6 h-6 text-inverse transition-transform duration-300" />
            ) : (
              <MessageCircle className="w-6 h-6 text-inverse transition-transform duration-300" />
            )}
          </div>

          {/* Sparkle effect */}
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-warning animate-pulse" />
          </div>

          {/* Notification badge (optional - for unread messages) */}
          {!isOpen && (
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-danger rounded-full animate-bounce"></div>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 px-3 py-2 rounded-lg shadow-lg transition-opacity duration-300 bg-surface text-primary border border-border">
            <div className="text-sm font-medium font-poppins">
              Hi! I&apos;m Aura 🤖
            </div>
            <div className="text-xs opacity-80 font-poppins">
              Your AI assistant
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuraChatButton;
