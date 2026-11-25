import { useState, useRef, useEffect } from "react";
import symbol from "@/assets/openprime-symbol-color.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import authService from "../../services/authService";
import { SERVICES_CONFIG, FIELD_TYPES } from "../../config/servicesConfig";
import { AURA_ERROR } from "./ai-chat/AuraConversation";
import ChatThread from "./ai-chat/ChatThread";
import Composer from "./ai-chat/Composer";
import SuggestionBox from "./ai-chat/SuggestionBox";
import {
  findServiceByDisplayName,
  extractSuggestionsFromText,
  validateServiceConfiguration,
} from "./ai-chat/suggestions";

// OP-263: the assistant gets an allow-list of wizard fields, never the whole
// wizard state. That state holds the git deploy key (gitRepository.sshKey) once
// a user pastes or generates one, and whatever is sent here reaches the backend
// and the model. Add a field only if it is safe to hand to the model.
const AI_CONTEXT_FIELDS = ["name", "provider", "region", "services"];

const toAiContext = (wizardValues) =>
  Object.fromEntries(
    AI_CONTEXT_FIELDS.filter(
      (field) => wizardValues?.[field] !== undefined,
    ).map((field) => [field, wizardValues[field]]),
  );

/**
 * Aura for one service of the wizard ("Ask Aura about EKS"): the shared Aura
 * thread and composer in a dialog, plus suggested config changes to apply.
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
  const inputRef = useRef(null);
  // A pending answer survives closing and reopening the dialog.
  const busy = isLoading || messages.some((m) => m.pending);

  // Initialize welcome message when modal opens
  useEffect(() => {
    if (isOpen && service && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: "ai",
        content: `I'm here to help you with ${serviceTitle}: configuration, security, cost and how it works with your other services. What would you like to know?`,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, service, serviceTitle, messages.length, setMessages]);

  /**
   * Handle dismissing a configuration suggestion
   */
  const denySuggestion = () => {
    setSuggestion(null);

    const dismissMessage = {
      id: Date.now(),
      type: "ai",
      content: "Suggestion dismissed.",
      tone: "status",
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
      let message = "Configuration applied.";

      // Add warnings and auto-fixes to the message
      if (warnings.length > 0) {
        message += `\n\nFixed compatibility issues:\n${warnings.map((w) => `- ${w}`).join("\n")}`;
      }

      if (Object.keys(fixes).length > 0) {
        message += `\n\nAlso changed for compatibility:\n${Object.entries(fixes)
          .map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`)
          .join("\n")}`;
      }

      const successMessage = {
        id: Date.now(),
        type: "ai",
        content: message,
        tone: "status",
      };
      setMessages((prev) => [...prev, successMessage]);
    }, 100);
  };

  /**
   * Send the composer's text and stream the answer from the AI backend
   */
  const handleSubmit = async () => {
    if (!inputText.trim() || busy) return;

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
    let aiMessage = { id: aiMessageId, type: "ai", content: "", pending: true };
    setMessages((prev) => [...prev, aiMessage]);
    const settle = (patch) =>
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, ...patch, pending: false } : msg,
        ),
      );

    try {
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
      const aiContext = toAiContext(wizardValues);
      const payloadMessages = [
        {
          type: "system",
          message: `The current environment configuration is: ${JSON.stringify(aiContext)}`,
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

      const response = await authService.makeAuthenticatedRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: payloadMessages,
          topic: serviceTitle,
          wizardValues: aiContext,
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
                settle({});
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Parse error:", err, "Line:", line);
            }
          }
        });
      }

      settle({});
      setIsLoading(false);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      // Show error message
      settle({ content: AURA_ERROR, error: true });
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        size="lg"
        className="flex h-[min(80dvh,44rem)] flex-col gap-0 p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader className="flex-row items-start gap-2.5 border-b py-3 pr-12 pl-4">
          <img src={symbol} alt="" className="mt-px size-5 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <DialogTitle>Ask Aura about {serviceTitle}</DialogTitle>
            <DialogDescription className="text-xs">
              Configuration, security and cost advice for this service.
            </DialogDescription>
          </div>
        </DialogHeader>

        <ChatThread messages={messages}>
          {suggestion && (
            <SuggestionBox
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={denySuggestion}
            />
          )}
        </ChatThread>

        <div className="shrink-0 p-3">
          <Composer
            ref={inputRef}
            value={inputText}
            onChange={setInputText}
            onSend={handleSubmit}
            busy={busy}
            placeholder={`Ask about ${serviceTitle}...`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatModal;
