import { useId, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/**
 * Destructive confirm: names the object, focus on Cancel, optional type-to-confirm.
 * `children` (e.g. a warning Callout) render between the description and the input.
 */
export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  typeToConfirm,
  onConfirm,
  children,
}) {
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const inputId = useId();
  const blocked = typeToConfirm !== undefined && typed !== typeToConfirm;

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setTyped("");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent data-confirm="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {typeToConfirm !== undefined ? (
          <Field>
            <FieldLabel htmlFor={inputId}>
              Type {typeToConfirm} to confirm
            </FieldLabel>
            <Input
              id={inputId}
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </Field>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={blocked || pending}
          >
            {pending ? <Spinner aria-hidden /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
