import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { SERVICES_CONFIG } from '../../config/servicesConfig';

const AIChatModal = ({
  isOpen,
  onClose,
  service,
  serviceTitle,
  wizardValues,
  messages,
  setMessages,
  setNewEnv 
}) => {
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && service && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hi! I'm here to help you with **${serviceTitle}**. I can provide information about:\n\n• Configuration best practices\n• Common use cases and patterns\n• Security recommendations\n• Cost optimization tips\n• Integration with other services\n\nWhat would you like to know?`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, service, serviceTitle, messages.length, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestion]);

  // Find service by display name (serviceTitle)
  const findServiceByDisplayName = (displayName) => {
    
    for (const [serviceName, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
      if (serviceConfig.displayName === displayName) {
        return serviceName;
      }
    }
    
    return null;
  };

  const extractSuggestionsFromText = (text, currentServiceName) => {
    
    // Only look for JSON - no text parsing at all
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());
        return parsed;
      } catch (err) {
        console.warn("Invalid JSON suggestion:", err);
      }
    }
    
    return {};
  };

  // Clear/deny suggestion
  const denySuggestion = () => {
    setSuggestion(null);
        
    const dismissMessage = {
      id: Date.now(),
      type: 'ai',
      content: '👍 Suggestion dismissed.'
    };
    setMessages(prev => [...prev, dismissMessage]);
  };

  // Apply suggestion
  const applySuggestion = () => {
    if (!suggestion) {
      return;
    }

    let currentServiceName = service;

    // If service prop doesn't work, try to find by serviceTitle (displayName)
    if (!currentServiceName || !SERVICES_CONFIG[currentServiceName]) {
      currentServiceName = findServiceByDisplayName(serviceTitle);
    }

    if (!currentServiceName) {
      return;
    }

    const serviceConfig = SERVICES_CONFIG[currentServiceName];
    
    // Build applied fields list BEFORE state update to avoid duplicates
    const appliedFields = [];
    Object.entries(suggestion).forEach(([suggestedKey, suggestedValue]) => {
      if (serviceConfig && serviceConfig.fields[suggestedKey]) {
        appliedFields.push(`${suggestedKey}: ${suggestedValue}`);
      }
    });

    setNewEnv(prev => {
      const updatedEnv = { ...prev };
      const updatedServices = { ...(prev.services || {}) };
      
      // Ensure the service exists in updatedServices
      if (!updatedServices[currentServiceName]) {
        updatedServices[currentServiceName] = {};
      }
      
      // Apply suggestions directly
      Object.entries(suggestion).forEach(([suggestedKey, suggestedValue]) => {
        if (serviceConfig && serviceConfig.fields[suggestedKey]) {
          updatedServices[currentServiceName][suggestedKey] = suggestedValue;
        } 
      });
      
      return { ...updatedEnv, services: updatedServices };
    });

    // Add success message (outside of setNewEnv to avoid React error)
    setTimeout(() => {
      const successMessage = {
        id: Date.now(),
        type: 'ai',
        content: `✅ Configuration applied successfully!`
      };
      setMessages(prev => [...prev, successMessage]);
    }, 0);

    // Clear the suggestion box
    setSuggestion(null);
  };

  // Handle submitting a question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { id: Date.now(), type: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = Date.now() + 1;
    let aiMessage = { id: aiMessageId, type: 'ai', content: '' };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001/api";
      
      // Find the actual service name for the backend
      let currentServiceName = service;
      if (!currentServiceName || !SERVICES_CONFIG[currentServiceName]) {
        currentServiceName = findServiceByDisplayName(serviceTitle);
      }
      
      const payloadMessages = [
        { type: 'system', message: `The current environment configuration is: ${JSON.stringify(wizardValues)}` },
        { type: 'system', message: `Available service options: ${Object.keys(SERVICES_CONFIG).join(', ')}` },
        { type: 'system', message: `Current service: ${currentServiceName || serviceTitle}` },
        { type: 'system', message: currentServiceName && SERVICES_CONFIG[currentServiceName] ? `Available fields for ${currentServiceName}: ${Object.keys(SERVICES_CONFIG[currentServiceName].fields).join(', ')}` : '' },
        { type: 'system', message: `When making suggestions, use JSON code blocks with exact field names from the available fields list. Example: \`\`\`json\n{"instanceCount": 3, "instanceType": "t3.medium"}\n\`\`\`` },
        ...messages
          .filter(m => m.content && m.content.trim() !== '')
          .map(m => ({ type: m.type === 'ai' ? 'assistant' : m.type, message: m.content })),
        { type: 'user', message: userMessage.content }
      ];

      const response = await fetch(`${backendUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          topic: serviceTitle,
          wizardValues,
          currentService: currentServiceName
        })
      });

      if (!response.ok || !response.body) throw new Error('Failed to connect to AI service');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split('\n').forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace(/^data: /, ''));
              if (data.chunk) {
                aiMessage.content += data.chunk;

                // Detect JSON suggestion
                const currentServiceName = service || findServiceByDisplayName(serviceTitle);
                const newSuggestion = extractSuggestionsFromText(aiMessage.content, currentServiceName);
                if (Object.keys(newSuggestion).length > 0) {
                  setSuggestion(newSuggestion);
                }

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, content: aiMessage.content } : msg
                  )
                );
              }
              if (data.done) setIsLoading(false);
            } catch (err) {
              console.error('Parse error:', err);
            }
          }
        });
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: "⚠️ Sorry, I couldn't connect to AI service right now." }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setIsLoading(false);
    setSuggestion(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ask AI about {serviceTitle}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get help with configuration and best practices
              </p>
            </div>
          </div>
          <button onClick={handleClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-900/30' : 'bg-gray-50/30'}`}>
          {messages.map((message) => {
            // Check if this is a status message (success/dismiss)
            const isStatusMessage = message.type === 'ai' && (
              message.content.startsWith('✅ Configuration applied successfully!') ||
              message.content.startsWith('👍 Suggestion dismissed.')
            );

            return (
              <div key={message.id} className={`flex items-start space-x-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'ai' && (
                  <div className={`p-2 rounded-lg flex-shrink-0 ${isStatusMessage ? 'bg-green-500/20' : 'bg-teal-500/20'}`}>
                    <Bot className={`w-4 h-4 ${isStatusMessage ? 'text-green-400' : 'text-teal-400'}`} />
                  </div>
                )}

                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user' 
                    ? (isDark ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white')
                    : isStatusMessage
                      ? (isDark ? 'bg-green-800 text-green-100 border border-green-700' : 'bg-green-50 text-green-800 border border-green-200')
                      : (isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900 border border-gray-200')
                }`}>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="p-2 bg-gray-500/20 rounded-lg flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestion preview box */}
          {suggestion && (
            <div className="flex items-start space-x-3 max-w-md">
              <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0 relative">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>

              <div className="relative p-4 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 shadow flex-1">
                <strong>💡 Suggested config changes:</strong>
                <pre className="mt-2 text-sm">{JSON.stringify(suggestion, null, 2)}</pre>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={applySuggestion}
                    className="px-3 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={denySuggestion}
                    className="px-3 py-1 rounded-lg bg-gray-500 text-white hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${serviceTitle}...`}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500'} focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${!inputText.trim() || isLoading ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;