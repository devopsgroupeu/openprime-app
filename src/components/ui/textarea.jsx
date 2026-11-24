import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // min 96 px, rounded-lg, field focus ring.
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,border-color,box-shadow] duration-(--dur-fast) outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/10 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
