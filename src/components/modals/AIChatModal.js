import React, { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot, User, Check } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { getApiUrl } from "../../utils/envValidator";
import { SERVICES_CONFIG, FIELD_TYPES } from "../../config/servicesConfig";

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
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const messagesEndRef = useRef(null);

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

  /**
   * Find service configuration by display name
   * Converts human-readable names back to service keys
   */
  const findServiceByDisplayName = (displayName) => {
    for (const [serviceName, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
      if (serviceConfig.displayName === displayName) {
        return serviceName;
      }
    }
    return null;
  };

  /**
   * Validate that a value is appropriate for a given field configuration
   */
  const isValidFieldValue = (value, fieldConfig) => {
    if (value === null || value === undefined) {
      return true; // Allow null/undefined values
    }

    switch (fieldConfig.type) {
      case FIELD_TYPES.TOGGLE:
        return typeof value === "boolean";

      case FIELD_TYPES.NUMBER:
        if (typeof value !== "number") return false;
        if (fieldConfig.min !== undefined && value < fieldConfig.min) return false;
        if (fieldConfig.max !== undefined && value > fieldConfig.max) return false;
        return true;

      case FIELD_TYPES.DROPDOWN:
        if (!fieldConfig.options) return true; // No options defined, allow any value
        return fieldConfig.options.some((option) => option.value === value);

      case FIELD_TYPES.MULTISELECT:
        if (!Array.isArray(value)) return false;
        if (!fieldConfig.options) return true; // No options defined, allow any values
        return value.every((v) => fieldConfig.options.some((option) => option.value === v));

      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.TEXTAREA:
        if (typeof value !== "string") return false;
        if (fieldConfig.validation?.pattern) {
          return fieldConfig.validation.pattern.test(value);
        }
        return true;

      case FIELD_TYPES.ARRAY:
        return Array.isArray(value);

      case FIELD_TYPES.OBJECT:
        return typeof value === "object" && value !== null && !Array.isArray(value);

      default:
        return true; // Unknown field type, allow any value
    }
  };

  /**
   * Extract configuration suggestions from AI response text
   * Looks for JSON code blocks with suggestion keywords and validates against service fields AND values
   */
  /**
   * Extract configuration suggestions from AI response text
   * NOW: Looks for ANY JSON code blocks and validates against service fields AND values
   * REMOVED: Keyword requirement - any JSON triggers a suggestion
   */
  const extractSuggestionsFromText = (text, currentServiceName) => {
    // Extract JSON code blocks (removed keyword check)
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());

        const serviceConfig = SERVICES_CONFIG[currentServiceName];
        if (!serviceConfig) return {};

        const validFields = Object.keys(serviceConfig.fields);

        let configToCheck = parsed;
        const keys = Object.keys(parsed);
        if (keys.length === 1 && typeof parsed[keys[0]] === "object" && parsed[keys[0]] !== null) {
          configToCheck = parsed[keys[0]];
        }

        // Validate both field names AND field values
        const validatedConfig = {};
        let hasValidFields = false;

        for (const [key, value] of Object.entries(configToCheck)) {
          if (!validFields.includes(key)) continue;

          const fieldConfig = serviceConfig.fields[key];

          // Validate the value based on field type
          if (isValidFieldValue(value, fieldConfig)) {
            validatedConfig[key] = value;
            hasValidFields = true;
          } else {
            console.warn(
              `Invalid value "${value}" for field "${key}" of type "${fieldConfig.type}". Skipping field.`,
            );
          }
        }

        if (!hasValidFields) return {};

        for (const [key, value] of Object.entries(configToCheck)) {
          if (!validFields.includes(key)) continue;

          const fieldConfig = serviceConfig.fields[key];

          // Validate the value based on field type
          if (isValidFieldValue(value, fieldConfig)) {
            validatedConfig[key] = value;
            hasValidFields = true;
          } else {
            console.warn(
              `Invalid value "${value}" for field "${key}" of type "${fieldConfig.type}". Skipping field.`,
            );
          }
        }

        if (!hasValidFields) return {};

        // Check if suggested config is different from current config
        const currentServiceConfig = wizardValues?.services?.[currentServiceName] || {};
        let isDifferent = false;
        for (const [key, value] of Object.entries(validatedConfig)) {
          if (currentServiceConfig[key] !== value) {
            isDifferent = true;
            break;
          }
        }

        // Only return suggestion if it's actually different
        return isDifferent ? validatedConfig : {};
      } catch (err) {
        console.warn("Invalid JSON suggestion:", err);
      }
    }

    return {};
  };

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
   * Generic validation system that works across all services based on field definitions
   */
  const validateServiceConfiguration = (serviceName, config) => {
    const warnings = [];
    const fixes = {};

    const serviceConfig = SERVICES_CONFIG[serviceName];
    if (!serviceConfig) return { warnings, fixes };

    // Get field definitions for validation
    const fields = serviceConfig.fields;

    // Validate each field against its constraints
    Object.entries(config).forEach(([fieldName, value]) => {
      const fieldDef = fields[fieldName];
      if (!fieldDef) return;

      // Validate number constraints
      if (fieldDef.type === FIELD_TYPES.NUMBER && typeof value === "number") {
        if (fieldDef.min !== undefined && value < fieldDef.min) {
          warnings.push(`${fieldDef.displayName || fieldName} is below minimum (${fieldDef.min})`);
          fixes[fieldName] = fieldDef.min;
        }
        if (fieldDef.max !== undefined && value > fieldDef.max) {
          warnings.push(`${fieldDef.displayName || fieldName} exceeds maximum (${fieldDef.max})`);
          fixes[fieldName] = fieldDef.max;
        }
      }

      // Validate dropdown values
      if (fieldDef.type === FIELD_TYPES.DROPDOWN && fieldDef.options) {
        const validValues = fieldDef.options.map((opt) => opt.value);
        if (!validValues.includes(value)) {
          warnings.push(`Invalid ${fieldDef.displayName || fieldName}: "${value}". Using default.`);
          fixes[fieldName] = fieldDef.defaultValue;
        }
      }

      // Validate multiselect arrays
      if (fieldDef.type === FIELD_TYPES.MULTISELECT && Array.isArray(value) && fieldDef.options) {
        const validValues = fieldDef.options.map((opt) => opt.value);
        const invalidValues = value.filter((v) => !validValues.includes(v));
        if (invalidValues.length > 0) {
          warnings.push(
            `Invalid ${fieldDef.displayName || fieldName} values: ${invalidValues.join(", ")}`,
          );
          fixes[fieldName] = value.filter((v) => validValues.includes(v));
          if (fixes[fieldName].length === 0 && fieldDef.defaultValue) {
            fixes[fieldName] = fieldDef.defaultValue;
          }
        }
      }

      // Validate text patterns
      if (
        (fieldDef.type === FIELD_TYPES.TEXT || fieldDef.type === FIELD_TYPES.TEXTAREA) &&
        typeof value === "string" &&
        fieldDef.validation?.pattern
      ) {
        if (!fieldDef.validation.pattern.test(value)) {
          warnings.push(`${fieldDef.displayName || fieldName} format is invalid`);
          if (fieldDef.defaultValue) {
            fixes[fieldName] = fieldDef.defaultValue;
          }
        }
      }
    });

    // Generic cross-field validations using common naming patterns
    const fieldNames = Object.keys(config);

    // Min/Max value pairs (works for any service with min*/max* fields)
    fieldNames.forEach((fieldName) => {
      if (fieldName.startsWith("min")) {
        const maxFieldName = fieldName.replace("min", "max");
        if (config[maxFieldName] !== undefined && config[fieldName] > config[maxFieldName]) {
          warnings.push(`${fieldName} cannot exceed ${maxFieldName}`);
          fixes[maxFieldName] = Math.max(
            config[fieldName],
            config[maxFieldName] || config[fieldName],
          );
        }
      }

      if (
        fieldName.startsWith("max") &&
        fieldName !== "maxNodes" &&
        fieldName !== "maxAllocatedStorage"
      ) {
        const minFieldName = fieldName.replace("max", "min");
        if (config[minFieldName] !== undefined && config[fieldName] < config[minFieldName]) {
          warnings.push(`${fieldName} cannot be less than ${minFieldName}`);
          fixes[fieldName] = Math.max(
            config[minFieldName],
            config[fieldName] || config[minFieldName],
          );
        }
      }
    });

    // Auto-scaling logic (generic for any service with enableAutoScaling)
    if (Object.hasOwn(config, "enableAutoScaling") && !config.enableAutoScaling) {
      // If auto-scaling is disabled, min and max should be equal
      const minField = fieldNames.find((f) => f.includes("min") && f.includes("Node"));
      const maxField = fieldNames.find((f) => f.includes("max") && f.includes("Node"));

      if (minField && maxField && config[minField] !== config[maxField]) {
        warnings.push(`Auto-scaling disabled: ${minField} and ${maxField} should be equal`);
        fixes[maxField] = config[minField];
      }
    }

    // Storage validation (generic for allocated/max storage patterns)
    if (
      config.allocatedStorage &&
      config.maxAllocatedStorage &&
      config.maxAllocatedStorage < config.allocatedStorage
    ) {
      warnings.push("Maximum storage cannot be less than allocated storage");
      fixes.maxAllocatedStorage = Math.max(config.allocatedStorage * 2, config.maxAllocatedStorage);
    }

    // Disk size recommendations (generic minimum disk size check)
    const diskFields = fieldNames.filter(
      (f) => f.toLowerCase().includes("disk") && fields[f]?.type === FIELD_TYPES.NUMBER,
    );
    diskFields.forEach((diskField) => {
      if (config[diskField] && config[diskField] < 20) {
        warnings.push(`${fields[diskField].displayName || diskField} may be too small`);
        fixes[diskField] = Math.max(50, fields[diskField].defaultValue || 50);
      }
    });

    // Enable/disable dependency validation
    Object.entries(config).forEach(([fieldName, value]) => {
      if (typeof value === "boolean" && value === true) {
        // Look for related fields that might need to be enabled
        const relatedFields = fieldNames.filter(
          (f) =>
            f !== fieldName &&
            (f.includes(fieldName.replace("enable", "").replace("Enable", "")) ||
              fieldName.includes(f.replace("enable", "").replace("Enable", ""))),
        );

        relatedFields.forEach((relatedField) => {
          if (typeof config[relatedField] === "boolean" && config[relatedField] === false) {
            // Don't auto-enable, just warn about potential conflicts
            const fieldDisplayName = fields[fieldName]?.displayName || fieldName;
            const relatedDisplayName = fields[relatedField]?.displayName || relatedField;
            warnings.push(
              `${fieldDisplayName} enabled but ${relatedDisplayName} is disabled - verify this is intentional`,
            );
          }
        });
      }
    });

    return { warnings, fixes };
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
    const { warnings, fixes } = validateServiceConfiguration(currentServiceName, mergedConfig);

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
        message += `\n\n🔧 Additional changes made for compatibility:\n${Object.entries(fixes)
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
              .filter(([_, field]) => field.type === FIELD_TYPES.DROPDOWN && field.options)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          topic: serviceTitle,
          wizardValues,
          currentService: currentServiceName,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to connect to AI service");

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
                const currentServiceName = service || findServiceByDisplayName(serviceTitle);
                const newSuggestion = extractSuggestionsFromText(
                  aiMessage.content,
                  currentServiceName,
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
                content: "⚠️ Sorry, I couldn't connect to AI service right now.",
              }
            : msg,
        ),
      );
      setIsLoading(false);
    }
  };

  // Add this helper function before the component
  const formatMessageContent = (content, isDark) => {
    // Check if message contains JSON code blocks
    const jsonCodeBlockRegex = /```json\n([\s\S]*?)\n```/g;

    if (!jsonCodeBlockRegex.test(content)) {
      // No JSON code blocks, return as is
      return <span>{content}</span>;
    }

    // Split content by JSON code blocks and format them
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex
    jsonCodeBlockRegex.lastIndex = 0;

    while ((match = jsonCodeBlockRegex.exec(content)) !== null) {
      // Add text before the JSON block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>,
        );
      }

      // Add formatted JSON block
      try {
        const jsonText = match[1].trim();
        const parsedJson = JSON.parse(jsonText);
        const formattedJson = JSON.stringify(parsedJson, null, 2);

        parts.push(
          <div
            key={`json-${match.index}`}
            className={`my-3 rounded-lg border ${
              isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`px-3 py-1 text-xs font-medium border-b ${
                isDark
                  ? "bg-gray-700 text-gray-300 border-gray-600"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              JSON Configuration
            </div>
            <pre
              className={`p-3 text-sm overflow-x-auto ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <code>{formattedJson}</code>
            </pre>
          </div>,
        );
      } catch (e) {
        // If JSON parsing fails, show as regular code block
        parts.push(
          <div
            key={`code-${match.index}`}
            className={`my-3 rounded-lg border ${
              isDark ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`px-3 py-1 text-xs font-medium border-b ${
                isDark
                  ? "bg-gray-700 text-gray-300 border-gray-600"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              Code
            </div>
            <pre
              className={`p-3 text-sm overflow-x-auto ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <code>{match[1]}</code>
            </pre>
          </div>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last JSON block
    if (lastIndex < content.length) {
      parts.push(<span key={`text-final`}>{content.substring(lastIndex)}</span>);
    }

    return <div>{parts}</div>;
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
        className={`rounded-xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Ask AI about {serviceTitle}
              </h2>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Get help with configuration and best practices
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? "bg-gray-900/30" : "bg-gray-50/30"}`}
        >
          {messages.map((message) => {
            // Check if this is a status message (success/dismiss notifications)
            const isStatusMessage =
              message.type === "ai" &&
              (message.content.startsWith("✅ Configuration applied successfully!") ||
                message.content.startsWith("👍 Suggestion dismissed."));

            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {message.type === "ai" && (
                  <div
                    className={`p-2 rounded-lg shrink-0 ${isStatusMessage ? "bg-green-500/20" : "bg-teal-500/20"}`}
                  >
                    <Bot
                      className={`w-4 h-4 ${isStatusMessage ? "text-green-400" : "text-teal-400"}`}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user"
                      ? isDark
                        ? "bg-teal-600 text-white"
                        : "bg-teal-500 text-white"
                      : isStatusMessage
                        ? isDark
                          ? "bg-green-800 text-green-100 border border-green-700"
                          : "bg-green-50 text-green-800 border border-green-200"
                        : isDark
                          ? "bg-gray-700 text-gray-100"
                          : "bg-white text-gray-900 border border-gray-200"
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
                      formatMessageContent(message.content, isDark)
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {message.type === "user" && (
                  <div className="p-2 bg-gray-500/20 rounded-lg shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-white border border-gray-200"}`}
              >
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Suggestion Box */}
          {suggestion && (
            <div className="flex items-start space-x-3 max-w-md">
              <div className="p-2 bg-teal-500/20 rounded-lg shrink-0 relative">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>

              <div className="relative p-4 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 shadow flex-1">
                <strong>💡 Suggested config changes:</strong>
                <pre className="mt-2 text-sm">{JSON.stringify(suggestion, null, 2)}</pre>
                <div className="mt-3 flex space-x-2">
                  {/* Apply Button */}
                  <button
                    onClick={applySuggestion}
                    className="px-3 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply</span>
                  </button>
                  {/* Dismiss Button */}
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

          {/* Scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div
          className={`p-4 border-t ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"}`}
        >
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask about ${serviceTitle}...`}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500"} focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2 rounded-lg transition-colors ${!inputText.trim() || isLoading ? (isDark ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed") : "bg-teal-600 text-white hover:bg-teal-700"}`}
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
