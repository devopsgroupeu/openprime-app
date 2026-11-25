// src/contexts/ToastContext.jsx
// useToast() and the toasts, drawn like openprime-ai's Sonner toaster:
// bottom-right, popover surface, one icon per tone.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  // The shown toasts as of the last change (addToast reads them between
  // renders) and each toast's auto-remove timer.
  const shown = useRef([]);
  const timers = useRef(new Map());

  const show = useCallback((next) => {
    shown.current = next;
    setToasts(next);
  }, []);

  const removeToast = useCallback(
    (id) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      show(shown.current.filter((toast) => toast.id !== id));
    },
    [show],
  );

  const addToast = useCallback(
    (message, type = "info", options = {}) => {
      // An identical toast already on screen is refreshed, not stacked.
      const same = shown.current.find(
        (t) =>
          t.message === message && t.type === type && t.title === options.title,
      );
      const id = same ? same.id : Date.now() + Math.random();
      const toast = {
        id,
        message,
        type,
        title: options.title,
        // { label, onClick }: one follow-up, e.g. "Open repository".
        action: options.action,
        duration: options.duration || 5000,
      };

      show(
        same
          ? shown.current.map((t) => (t.id === id ? toast : t))
          : [...shown.current, toast],
      );

      // Auto remove after duration, counted from the latest show
      clearTimeout(timers.current.get(id));
      if (toast.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            removeToast(id);
          }, toast.duration),
        );
      }

      return id;
    },
    [removeToast, show],
  );

  const clearAllToasts = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    show([]);
  }, [show]);

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

      {/* Above dialogs. Bottom right, clear of the Aura launcher and the wizard
          footer; left of the wizard's Aura column. On phones and while Aura
          is open in a dialog (its composer sits at the bottom) they drop from
          the top, under the top bar and off dialog footers. */}
      <section
        aria-live="polite"
        aria-label="Notifications"
        className={cn(
          "pointer-events-none fixed right-4 bottom-20 z-70 flex w-[min(22.5rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6",
          "max-sm:top-15 max-sm:bottom-auto",
          "xl:[body:has(aside_[data-slot=prompt-input])_&]:right-86",
          "[body:has([role=dialog]_[data-slot=prompt-input])_&]:top-15 [body:has([role=dialog]_[data-slot=prompt-input])_&]:right-1/2 [body:has([role=dialog]_[data-slot=prompt-input])_&]:bottom-auto [body:has([role=dialog]_[data-slot=prompt-input])_&]:translate-x-1/2",
        )}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </section>
    </ToastContext.Provider>
  );
};

export default ToastContext;
