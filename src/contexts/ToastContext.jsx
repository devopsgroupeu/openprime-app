// src/contexts/ToastContext.jsx
// useToast() and the toasts, drawn like openprime-ai's Sonner toaster:
// bottom-right, popover surface, one icon per tone.
import { createContext, useContext, useState, useCallback } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const TONES = {
  success: { Icon: CircleCheck, color: "text-primary" },
  error: { Icon: CircleAlert, color: "text-destructive" },
  warning: { Icon: TriangleAlert, color: "text-warning" },
  info: { Icon: Info, color: "text-info" },
};

const ToastItem = ({ toast, onRemove }) => {
  const { Icon, color } = TONES[toast.type] ?? TONES.info;
  return (
    <div
      data-slot="toast"
      data-type={toast.type}
      className="motion-enter pointer-events-auto flex w-full items-start gap-2.5 rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg"
    >
      <Icon aria-hidden className={`mt-px size-4 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1 break-words">
        {toast.title && <p className="font-medium">{toast.title}</p>}
        <p
          className={
            toast.title ? "mt-0.5 text-muted-foreground" : "font-medium"
          }
        >
          {toast.message}
        </p>
        {toast.action ? (
          <Button
            variant="secondary"
            size="xs"
            className="mt-2"
            onClick={() => {
              onRemove(toast.id);
              toast.action.onClick();
            }}
          >
            {toast.action.label}
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
        className="-mt-1 -mr-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-(--dur-fast) outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden className="size-3.5" />
      </button>
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
        // { label, onClick }: one follow-up, e.g. "Open repository".
        action: options.action,
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

      {/* Above dialogs; bottom-20 clears the Aura launcher and the wizard footer. */}
      <section
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 bottom-20 z-70 flex w-[min(22.5rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </section>
    </ToastContext.Provider>
  );
};

export default ToastContext;
