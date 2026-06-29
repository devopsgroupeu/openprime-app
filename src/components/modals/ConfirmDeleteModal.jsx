import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";

const ConfirmDeleteModal = ({
  environment,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const closeButtonRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Initial focus on the close button
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete"
        className="w-full max-w-md mx-4 rounded-2xl border border-border bg-surface shadow-xl transition-colors"
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center text-primary transition-colors">
            <AlertTriangle className="w-6 h-6 text-danger mr-2" />
            {title || "Delete Environment"}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-4 text-secondary transition-colors">
            {message ||
              `Are you sure you want to delete the environment "${environment?.name}"?`}
          </p>
          <p className="mb-6 text-sm text-tertiary transition-colors">
            This action cannot be undone. All configuration for this environment
            will be permanently removed.
          </p>

          <div className="flex space-x-3">
            <button onClick={onClose} className="btn-op-secondary flex-1">
              Cancel
            </button>
            <button onClick={onConfirm} className="btn-op-danger flex-1">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
