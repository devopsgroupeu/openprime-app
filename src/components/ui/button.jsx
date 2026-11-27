import { cva } from "class-variance-authority";
import { cn, TOUCH_HIT } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  // rounded-lg, 13 px medium, 32 / 28 / 36 px, focus = 2 px full ring.
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,filter] duration-(--dur-fast) outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-(--shadow-button-primary) hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive dark:border dark:border-destructive/60 dark:bg-destructive/15 dark:text-destructive-foreground dark:hover:bg-destructive/25",
        // Kept for compatibility; looks like secondary.
        outline:
          "bg-secondary text-secondary-foreground shadow-(--shadow-button-secondary) hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-(--shadow-button-secondary) hover:bg-accent hover:text-accent-foreground",
        ghost:
          "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground/80 underline underline-offset-2 hover:text-foreground",
      },
      // Touch targets >= 44 px below md: text sizes grow, icon sizes get an invisible hit area.
      size: {
        default: "h-8 px-2.5 max-md:min-h-11",
        xs: "h-6 gap-1 rounded-md px-1.5 text-xs [&_svg:not([class*='size-'])]:size-3 max-md:min-h-11",
        sm: "h-7 gap-1 rounded-md px-2 max-md:min-h-11",
        lg: "h-9 px-3.5 max-md:min-h-11",
        icon: `size-8 ${TOUCH_HIT}`,
        "icon-xs": `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3.5 ${TOUCH_HIT}`,
        "icon-sm": `size-7 rounded-md ${TOUCH_HIT}`,
        "icon-lg": `size-9 ${TOUCH_HIT}`,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
