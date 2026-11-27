import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** A row control with its error message under it; `id` is the control's id. */
export function FieldControl({ id, error, className, children }) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5 sm:w-72", className)}>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

/** aria props of a control that may carry an error. */
export const invalidProps = (id, error) =>
  error
    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
    : { "aria-invalid": undefined };
