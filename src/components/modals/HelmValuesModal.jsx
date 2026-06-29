// src/components/modals/HelmValuesModal.js

import { useEffect, useRef } from "react";

const HelmValuesModal = ({ chartName, values, onChange, onClose, onSave }) => {
  const textareaRef = useRef(null);

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

  // Initial focus on the values textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="helm-values-modal-title"
        className="rounded-2xl p-8 max-w-4xl w-full bg-surface"
      >
        <h2
          id="helm-values-modal-title"
          className="text-2xl font-bold mb-6 text-primary"
        >
          Edit {chartName} Values
        </h2>

        <div className="rounded-lg p-4 bg-background border border-border">
          <textarea
            ref={textareaRef}
            className="w-full h-64 bg-transparent font-mono text-sm resize-none focus:outline-none text-success"
            value={values}
            onChange={(e) => onChange(e.target.value)}
            spellCheck="false"
            aria-label={`Edit YAML values for ${chartName}`}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-op-secondary"
            aria-label="Cancel editing"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn-op-primary"
            aria-label={`Save ${chartName} configuration`}
          >
            Save Values
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelmValuesModal;
