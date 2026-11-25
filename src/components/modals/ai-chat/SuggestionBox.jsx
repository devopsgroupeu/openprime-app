import { Check, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";

// Aura's suggested config changes with Apply / Dismiss, after the messages.
// Actions are owned by AIChatModal and passed in.
const SuggestionBox = ({ suggestion, onApply, onDismiss }) => {
  return (
    <div
      data-slot="suggestion"
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-sm shadow-xs"
    >
      <p className="flex items-center gap-2 font-medium">
        <Lightbulb aria-hidden className="size-4 text-muted-foreground" />
        Suggested changes
      </p>
      <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-5">
        {JSON.stringify(suggestion, null, 2)}
      </pre>
      <div className="flex gap-2">
        <Button size="sm" onClick={onApply}>
          <Check aria-hidden />
          Apply changes
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
};

export default SuggestionBox;
