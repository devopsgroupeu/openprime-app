import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot } from "lucide-react";
import { getApiUrl } from "../../utils/envValidator";
import keycloak from "../../config/keycloak";
import { SERVICES_CONFIG, FIELD_TYPES } from "../../config/servicesConfig";
import ChatMessage from "./ai-chat/ChatMessage";
import SuggestionBox from "./ai-chat/SuggestionBox";
import {
  findServiceByDisplayName,
  extractSuggestionsFromText,
  validateServiceConfiguration,
} from "./ai-chat/suggestions";

/**
 * AI Chat Modal Component
 * Provides an interactive chat interface for getting AI assistance with service configurations
 */
const AIChatModal = ({
  isOpen,
  onClose,
  service,
  serviceTitle,
  wizardValues,
  messages,
  setMessages,
  setNewEnv,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const messagesEndRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize welcome message when modal opens
  useEffect(() => {
    if (isOpen && service && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: "ai",
        content: `Hi! I'm here to help you with <strong>${serviceTitle}</strong>. I can provide information about:\n\n• Configuration best practices\n• Common use cases and patterns\n• Security recommendations\n• Cost optimization tips\n• Integration with other services\n\nWhat would you like to know?`,
        isHtml: true,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, service, serviceTitle, messages.length, setMessages]);

  // Auto-scroll when messages or suggestions change
  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestion]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initial focus on the close button when the modal opens
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  /**
   * Handle dismissing a configuration suggestion
   */
  const denySuggestion = () => {
    setSuggestion(null);

    const dismissMessage = {
      id: Date.now(),
      type: "ai",
      content: "👍 Suggestion dismissed.",
    };
    setMessages((prev) => [...prev, dismissMessage]);
  };

  /**
   * Apply the suggested configuration to the environment
   */
  const applySuggestion = () => {
    if (!suggestion) return;

    // Prevent double-application by immediately clearing suggestion
    const suggestionToApply = suggestion;
    setSuggestion(null);

    let currentServiceName = service;
    if (!currentServiceName || !SERVICES_CONFIG[currentServiceName]) {
      currentServiceName = findServiceByDisplayName(serviceTitle);
    }
    if (!currentServiceName) return;

    const serviceConfig = SERVICES_CONFIG[currentServiceName];

    // Get current configuration and merge with suggestions
    const currentConfig = wizardValues?.services?.[currentServiceName] || {};
    const mergedConfig = { ...currentConfig, ...suggestionToApply };

    // Validate the complete merged configuration
    const { warnings, fixes } = validateServiceConfiguration(
      currentServiceName,
      mergedConfig,
    );

    // Apply suggestions and any necessary fixes
    const finalConfig = { ...mergedConfig, ...fixes };

    // Update environment configuration
    setNewEnv((prev) => {
      const updatedEnv = { ...prev };
      const updatedServices = { ...(prev.services || {}) };

      // Ensure service exists in configuration
      if (!updatedServices[currentServiceName]) {
        updatedServices[currentServiceName] = {};
      }

      // Apply the final validated configuration
      Object.entries(finalConfig).forEach(([key, value]) => {
        if (serviceConfig && serviceConfig.fields[key]) {
          updatedServices[currentServiceName][key] = value;
        }
      });

      return { ...updatedEnv, services: updatedServices };
    });

    setTimeout(() => {
      let message = `✅ Configuration applied successfully!`;

      // Add warnings and auto-fixes to the message
      if (warnings.length > 0) {
        message += `\n\n⚠️ Compatibility issues detected and fixed:\n${warnings.map((w) => `• ${w}`).join("\n")}`;
      }

      if (Object.keys(fixes).length > 0) {
        message += `\n\n🔧 Additional changes made for compatibility:\n${Object.entries(
          fixes,
        )
          .map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`)
          .join("\n")}`;
      }

      const successMessage = {
        id: Date.now(),
        type: "ai",
        content: message,
      };
      setMessages((prev) => [...prev, successMessage]);
    }, 100);
  };

  /**
   * Handle form submission and communicate with AI backend
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setSuggestion(null);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputText.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    const aiMessageId = Date.now() + 1;
    let aiMessage = { id: aiMessageId, type: "ai", content: "" };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const apiUrl = getApiUrl();

      let currentServiceName = service;
      if (!currentServiceName || !SERVICES_CONFIG[currentServiceName]) {
        currentServiceName = findServiceByDisplayName(serviceTitle);
      }

      // Build dropdown field constraints message
      const dropdownConstraints =
        currentServiceName && SERVICES_CONFIG[currentServiceName]
          ? Object.entries(SERVICES_CONFIG[currentServiceName].fields)
              .filter(
                ([_, field]) =>
                  field.type === FIELD_TYPES.DROPDOWN && field.options,
              )
              .map(
                ([fieldName, field]) =>
                  `${fieldName}: [${field.options.map((opt) => opt.value).join(", ")}]`,
              )
              .join("; ")
          : "";

      // Build context for AI (system messages + conversation history)
      const payloadMessages = [
        {
          type: "system",
          message: `The current environment configuration is: ${JSON.stringify(wizardValues)}`,
        },
        {
          type: "system",
          message: `Available service options: ${Object.keys(SERVICES_CONFIG).join(", ")}`,
        },
        {
          type: "system",
          message: `Current service: ${currentServiceName || serviceTitle}`,
        },
        {
          type: "system",
          message:
            currentServiceName && SERVICES_CONFIG[currentServiceName]
              ? `Available fields for ${currentServiceName}: ${Object.keys(SERVICES_CONFIG[currentServiceName].fields).join(", ")}`
              : "",
        },
        {
          type: "system",
          message: dropdownConstraints
            ? `Dropdown field constraints for ${currentServiceName}: ${dropdownConstraints}`
            : "",
        },
        {
          type: "system",
          message: `Current ${currentServiceName} configuration: ${JSON.stringify(wizardValues?.services?.[currentServiceName] || {})}`,
        },
        {
          type: "system",
          message: `When making configuration suggestions: 1) First analyze if the current config is already optimal for the user's needs. 2) If current config is already good, just explain why it's optimal instead of suggesting changes. 3) Only suggest changes when there's a meaningful improvement. 4) When suggesting changes, use JSON code blocks with exact field names and ONLY use valid field values (especially for dropdown fields - stick to the allowed options). 5) Include suggestion keywords like "I recommend". 6) Avoid suggesting minor variations (like different CIDR ranges) of essentially the same configuration strategy.`,
        },
        // Add conversation history
        ...messages
          .filter((m) => m.content && m.content.trim() !== "")
          .map((m) => ({
            type: m.type === "ai" ? "assistant" : m.type,
            message: m.content,
          })),
        { type: "user", message: userMessage.content },
      ];

      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          topic: serviceTitle,
          wizardValues,
          currentService: currentServiceName,
        }),
      });

      if (!response.ok || !response.body)
        throw new Error("Failed to connect to AI service");

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
                aiMessage.content += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? {
                          ...msg,
                          content: aiMessage.content,
                        }
                      : msg,
                  ),
                );
              }

              if (data.done) {
                const currentServiceName =
                  service || findServiceByDisplayName(serviceTitle);
                const newSuggestion = extractSuggestionsFromText(
                  aiMessage.content,
                  currentServiceName,
                  wizardValues,
                );

                if (Object.keys(newSuggestion).length > 0) {
                  setSuggestion(newSuggestion);
                }
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Parse error:", err, "Line:", line);
            }
          }
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      // Show error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  "⚠️ Sorry, I couldn't connect to AI service right now.",
              }
            : msg,
        ),
      );
      setIsLoading(false);
    }
  };

  /**
   * Clean up and close modal
   */
  const handleClose = () => {
    setInputText("");
    setIsLoading(false);
    setSuggestion(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI assistant"
        className="rounded-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl bg-surface"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-muted rounded-lg">
              <MessageCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Ask AI about {serviceTitle}
              </h2>
              <p className="text-sm text-tertiary">
                Get help with configuration and best practices
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Close"
            className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-secondary">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-primary-muted rounded-lg">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border">
                <div className="flex space-x-2">
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
          )}

          {/* Configuration Suggestion Box */}
          {suggestion && (
            <SuggestionBox
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={denySuggestion}
            />
          )}

          {/* Scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-border bg-surface">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${serviceTitle}...`}
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-lg border bg-background border-border text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-muted"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${!inputText.trim() || isLoading ? "bg-background text-tertiary cursor-not-allowed" : "bg-primary text-white hover:bg-primary-muted"}`}
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
