import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/contexts/ToastContext";

/**
 * Copies `text`; for 1.5 s the icon turns into a check and the name into
 * "Copied" (in-view feedback, no toast). Icon-only with a tooltip, or a
 * secondary button with `visibleLabel`.
 */
export function CopyButton({ text, label, visibleLabel, size, className }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };
  const button = (
    <Button
      type="button"
      variant={visibleLabel ? "secondary" : "ghost"}
      size={size ?? (visibleLabel ? "default" : "icon-sm")}
      aria-label={copied ? "Copied" : label}
      className={className}
      onClick={copy}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {visibleLabel && copied ? "Copied" : visibleLabel}
    </Button>
  );
  if (visibleLabel) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : label}</TooltipContent>
    </Tooltip>
  );
}
