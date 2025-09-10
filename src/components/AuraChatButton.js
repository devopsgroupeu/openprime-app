// src/components/AuraChatButton.js
import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import AuraChatWindow, { INITIAL_MESSAGES } from './AuraChatWindow';

const AuraChatButton = () => {
  const { isDark } = useTheme();
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
      <div className="fixed bottom-6 right-6 z-[60]">
        <button
          onClick={toggleChat}
          className={`aura-chat-button relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 ${
            isDark
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 focus:ring-teal-500/50'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 focus:ring-teal-400/50'
          } ${isOpen ? 'rotate-180' : ''}`}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 opacity-20 animate-pulse"></div>

          {/* Icon */}
          <div className="relative flex items-center justify-center w-full h-full">
            {isOpen ? (
              <X className="w-6 h-6 text-white transition-transform duration-300" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white transition-transform duration-300" />
            )}
          </div>

          {/* Sparkle effect */}
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>

          {/* Notification badge (optional - for unread messages) */}
          {!isOpen && (
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className={`absolute bottom-16 right-0 mb-2 px-3 py-2 rounded-lg shadow-lg transition-opacity duration-300 ${
            isDark
              ? 'bg-gray-800 text-white border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}>
            <div className="text-sm font-medium">Hi! I'm Aura 🤖</div>
            <div className="text-xs opacity-80">Your AI assistant</div>
            {/* Tooltip arrow */}
            <div className={`absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              isDark ? 'border-t-gray-800' : 'border-t-white'
            }`}></div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuraChatButton;
