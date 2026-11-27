import { Callout } from "@/components/shared/callout";
import { ConfirmDestructiveDialog } from "@/components/shared/confirm-destructive-dialog";

// Deletes an environment (detail and list pages: type the name to confirm) or,
// with title, message and warningData, a cloud credential (SettingsPage).
// Callers that mount it conditionally leave isOpen out.
const ConfirmDeleteModal = ({
  environment,
  isOpen = true,
  onClose,
  onConfirm,
  title,
  message,
  warningData,
}) => {
  const hasUsageWarning =
    warningData && !warningData.checkFailed && warningData.count > 0;
  const hasCheckFailed = warningData && warningData.checkFailed;
  const visibleEnvironments = warningData?.environments?.slice(0, 5) || [];
  const remainingCount = hasUsageWarning
    ? warningData.count - visibleEnvironments.length
    : 0;

  return (
    <ConfirmDestructiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title || `Delete "${environment?.name}"?`}
      description={
        message ||
        "This removes the environment from OpenPrime and can't be undone. AWS resources, the Terraform state bucket and code already pushed to git are not touched."
      }
      confirmLabel="Delete"
      typeToConfirm={environment?.name}
      onConfirm={onConfirm}
    >
      {hasUsageWarning ? (
        <Callout variant="warning">
          This credential is used by {warningData.count} environment
          {warningData.count === 1 ? "" : "s"}. Deleting it unlinks them, so
          they can&apos;t generate or push infrastructure until you assign other
          credentials.
          {visibleEnvironments.length > 0 ? (
            <ul className="mt-1.5 list-disc pl-4 text-muted-foreground">
              {visibleEnvironments.map((env) => (
                <li key={env.id}>{env.name}</li>
              ))}
              {remainingCount > 0 ? (
                <li className="list-none">and {remainingCount} more</li>
              ) : null}
            </ul>
          ) : null}
        </Callout>
      ) : null}
      {hasCheckFailed ? (
        <Callout variant="warning">
          Couldn&apos;t check which environments use this credential. They keep
          working but lose their link to it.
        </Callout>
      ) : null}
    </ConfirmDestructiveDialog>
  );
};

export default ConfirmDeleteModal;
