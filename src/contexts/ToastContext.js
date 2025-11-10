// src/contexts/ToastContext.js
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useTheme } from "./ThemeContext";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastItem = ({ toast, onRemove }) => {
  const { isDark } = useTheme();

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "error":
        return <XCircle className="w-5 h-5 text-danger" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-l-success";
      case "error":
        return "border-l-danger";
      case "warning":
        return "border-l-warning";
      case "info":
      default:
        return "border-l-info";
    }
  };

  return (
    <div
      className={`w-full border-l-4 rounded-lg shadow-lg pointer-events-auto transform transition-all duration-300 ease-in-out ${getBorderColor()} ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {toast.title && (
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {toast.title}
              </p>
            )}
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              } ${toast.title ? "mt-1" : ""}`}
            >
              {toast.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onRemove(toast.id)}
              className={`inline-flex rounded-md transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", options = {}) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type,
        title: options.title,
        duration: options.duration || 5000,
      };

      setToasts((prev) => [...prev, toast]);

      // Auto remove after duration
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, toast.duration);
      }

      return id;
    },
    [removeToast],
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, options = {}) => {
      return addToast(message, "success", options);
    },
    [addToast],
  );

  const error = useCallback(
    (message, options = {}) => {
      return addToast(message, "error", options);
    },
    [addToast],
  );

  const warning = useCallback(
    (message, options = {}) => {
      return addToast(message, "warning", options);
    },
    [addToast],
  );

  const info = useCallback(
    (message, options = {}) => {
      return addToast(message, "info", options);
    },
    [addToast],
  );

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast,
        clearAllToasts,
        success,
        error,
        warning,
        info,
        toasts,
      }}
    >
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-[70] space-y-3 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
        style={{ width: "min(400px, calc(100vw - 2rem))" }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
