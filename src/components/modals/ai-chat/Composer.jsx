import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Aura's composer (port of openprime-ai PromptInput): a rounded-2xl card with
 * an auto-growing textarea and a round Send button, the only saturated control
 * while there is something to send. Enter sends, Shift+Enter adds a line.
 * While Aura answers (`busy`) the button is Stop (`onStop`). `ref` reaches the
 * textarea.
 */
const Composer = ({
  ref,
  value,
  onChange,
  onSend,
  onStop,
  placeholder,
  busy,
}) => {
  const canSend = value.trim() !== "" && !busy;
  const send = () => {
    if (canSend) onSend();
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        data-slot="prompt-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex flex-col gap-2 rounded-2xl border border-input bg-card pt-3 pr-2.5 pb-2.5 pl-3.5 transition-[border-color] duration-(--dur-fast) focus-within:border-ring"
      >
        <textarea
          ref={ref}
          aria-label="Message Aura"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // The Enter that ends an IME composition picks the text, never
            // sends it (Safari flags it with keyCode 229 only).
            const composing = e.nativeEvent.isComposing || e.keyCode === 229;
            if (e.key === "Enter" && !e.shiftKey && !composing) {
              e.preventDefault();
              send();
            }
          }}
          className="field-sizing-content max-h-50 min-h-6 w-full resize-none bg-transparent text-base outline-none [scrollbar-width:thin] placeholder:text-muted-foreground md:text-md"
        />
        <div className="flex h-8 items-center justify-end">
          {busy ? (
            <Button
              type="button"
              size="icon"
              aria-label="Stop"
              className="rounded-full"
              onClick={(e) => {
                onStop();
                // The button turns into a disabled Send: keep focus usable.
                e.currentTarget.form.querySelector("textarea").focus();
              }}
            >
              <Square aria-hidden className="fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={!canSend}
              className="rounded-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
            >
              <ArrowUp aria-hidden />
            </Button>
          )}
        </div>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        Aura can be wrong. Check its answers.
      </p>
    </div>
  );
};

export default Composer;
