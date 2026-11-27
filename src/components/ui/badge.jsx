import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-1.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        // Status pills: meaning in text + icon, never color alone.
        success: "bg-primary/10 text-primary",
        neutral: "bg-muted text-muted-foreground",
        attention: "bg-warning/10 text-foreground [&>svg]:text-warning",
        error: "bg-destructive/10 text-foreground [&>svg]:text-destructive",
        info: "bg-info/10 text-foreground [&>svg]:text-info",
        // Meta tag ("Form", "Featured", "Version 3").
        tag: "rounded-md bg-muted font-normal text-muted-foreground",
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground focus-visible:ring-destructive dark:border-destructive/40 dark:bg-destructive/15 dark:text-destructive [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
