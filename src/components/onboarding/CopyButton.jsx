import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

// Copies one value and says so for a moment, so the user knows it worked.
const CopyButton = ({ value, label }) => {
  const [state, setState] = useState("idle");

  useEffect(() => {
    if (state === "idle") return undefined;
    const timer = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-40"
    >
      {state === "copied" ? (
        <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
    </button>
  );
};

export default CopyButton;
