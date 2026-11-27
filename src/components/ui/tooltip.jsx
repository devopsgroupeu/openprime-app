import { cn } from "@/lib/utils";
import { Tooltip as TooltipPrimitive } from "radix-ui";

// Open after 400 ms, no delay when moving between tooltips.
function TooltipProvider({ delayDuration = 400, ...props }) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({ className, sideOffset = 4, children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      {/* Inverted pill without an arrow; may hold a Kbd chip. Hidden on touch:
          focus returning to a trigger would open it with nothing to dismiss it,
          and the trigger's aria-label already names it. */}
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-64 origin-(--radix-tooltip-content-transform-origin) animate-in items-center gap-1.5 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-balance text-background shadow-sm fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-coarse:hidden",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
