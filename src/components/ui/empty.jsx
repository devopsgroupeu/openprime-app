import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

function Empty({ className, ...props }) {
  return (
    <div
      data-slot="empty"
      className={cn(
        // Centered stack, 48 px vertical padding; EmptyState adds the dashed box.
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl px-6 py-12 text-center text-balance",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-1 text-center",
        className,
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        // 44 px tile with a 20 px concept icon.
        icon: "flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function EmptyMedia({ className, variant = "default", ...props }) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-md font-medium", className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-xs text-muted-foreground [&>a]:underline [&>a]:underline-offset-2 [&>a:hover]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-wrap items-center justify-center gap-2 text-sm text-balance",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
