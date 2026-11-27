import { cn, TOUCH_HIT } from "@/lib/utils";
import { Switch as SwitchPrimitive } from "radix-ui";

function Switch({ className, size = "default", ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // h-5 w-9, thumb size-3.5, on primary, off input.
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent px-0.5 transition-[color,background-color,border-color,box-shadow] duration-(--dur-fast) outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        TOUCH_HIT,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-xs ring-0 transition-transform duration-(--dur-fast) group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-[state=checked]:translate-x-4 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
