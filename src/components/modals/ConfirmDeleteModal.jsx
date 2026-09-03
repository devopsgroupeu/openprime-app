import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";

const ConfirmDeleteModal = ({
  environment,
  onClose,
  onConfirm,
  title,
  message,
  warningData,
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

  const hasUsageWarning =
    warningData && !warningData.checkFailed && warningData.count > 0;
  const hasCheckFailed = warningData && warningData.checkFailed;
  const visibleEnvironments = warningData?.environments?.slice(0, 5) || [];
  const remainingCount = hasUsageWarning
    ? warningData.count - visibleEnvironments.length
    : 0;

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
          {hasUsageWarning && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning-muted p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">
                    This credential is used by {warningData.count} environment
                    {warningData.count === 1 ? "" : "s"}. Deleting it will
                    unlink them — they will no longer be able to generate or
                    push infrastructure until a new credential is assigned.
                  </p>
                  {visibleEnvironments.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-secondary">
                      {visibleEnvironments.map((env) => (
                        <li key={env.id} className="flex items-center gap-1.5">
                          <span className="text-warning">•</span>
                          {env.name}
                        </li>
                      ))}
                      {remainingCount > 0 && (
                        <li className="text-tertiary text-xs mt-1">
                          and {remainingCount} more…
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasCheckFailed && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning-muted p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-warning">
                  Couldn&apos;t check which environments use this credential —
                  they will keep working but lose their cloud credential link.
                </p>
              </div>
            </div>
          )}

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
