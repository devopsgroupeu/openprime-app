import { Bot, Check, X } from "lucide-react";

// The "suggested config changes" card with Apply / Dismiss actions.
// Extracted from AIChatModal; actions are owned by the parent and passed in.
const SuggestionBox = ({ suggestion, onApply, onDismiss }) => {
  return (
    <div className="flex items-start space-x-3 max-w-md">
      <div className="p-2 bg-primary-muted rounded-lg shrink-0 relative">
        <Bot className="w-4 h-4 text-accent" />
      </div>

      <div className="relative p-4 rounded-lg border bg-warning-muted text-warning border-warning shadow flex-1">
        <strong>💡 Suggested config changes:</strong>
        <pre className="mt-2 text-sm">
          {JSON.stringify(suggestion, null, 2)}
        </pre>
        <div className="mt-3 flex space-x-2">
          {/* Apply Button */}
          <button onClick={onApply} className="btn-op-primary">
            <Check className="w-4 h-4" />
            <span>Apply</span>
          </button>
          {/* Dismiss Button */}
          <button onClick={onDismiss} className="btn-op-secondary">
            <X className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionBox;
