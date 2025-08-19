// src/components/AuraChatWindow.js
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Minimize2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const INITIAL_MESSAGES = [
  {
    id: 1,
    type: 'bot',
    message: 'Hi there! 👋 I\'m Aura, your AI assistant for OpenPrime. I can help you with infrastructure configuration, explain services, and answer questions about your deployments.',
    timestamp: new Date()
  },
  {
    id: 2,
    type: 'bot',
    message: 'What would you like to know? You can ask me about:\n• AWS, Azure, or GCP services\n• Kubernetes and Helm charts\n• Infrastructure best practices\n• Troubleshooting deployment issues',
    timestamp: new Date()
  }
];

const SAMPLE_RESPONSES = [
  "I'd be happy to help you with that! However, I'm currently a demo version. In a full implementation, I would connect to an AI service to provide detailed infrastructure guidance.",
  "That's a great question about infrastructure! In a production version, I would analyze your configuration and provide specific recommendations.",
  "I can see you're interested in that topic. A real AI integration would give you detailed explanations and step-by-step guidance.",
  "Excellent question! When fully integrated with an AI backend, I could provide comprehensive answers about cloud infrastructure and best practices."
];

const AuraChatWindow = ({ onClose }) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const randomResponse = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: randomResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-[60]">
        <div
          onClick={() => setIsMinimized(false)}
          className={`cursor-pointer px-4 py-2 rounded-lg shadow-lg transition-all hover:scale-105 ${
            isDark
              ? 'bg-gray-800 border border-gray-700 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium">Aura</span>
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aura-chat-window fixed bottom-20 right-6 z-[60] w-96 h-[500px] flex flex-col">
      {/* Chat Header */}
      <div className={`flex items-center justify-between p-4 rounded-t-lg border-b ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      } shadow-lg`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-teal-500" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className={`font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Aura AI
            </h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-end space-x-2 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  msg.type === 'user'
                    ? 'bg-teal-500'
                    : isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  {msg.type === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-teal-500" />
                  )}
                </div>
                <div className={`px-3 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                    : isDark
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.type === 'user'
                      ? 'text-teal-100'
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
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
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <Bot className="w-3 h-3 text-teal-500" />
              </div>
              <div className={`px-3 py-2 rounded-lg ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      } rounded-b-lg shadow-lg`}>
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Aura anything about infrastructure..."
            rows={1}
            className={`flex-1 px-3 py-2 border rounded-lg resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500'
            }`}
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-3 py-2 rounded-lg transition-all ${
              inputMessage.trim() && !isTyping
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg'
                : isDark
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
