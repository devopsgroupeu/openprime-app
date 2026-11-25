import { useId, useRef } from "react";
import { CircleCheck, Link, Plus } from "lucide-react";
import ServiceIcon from "../../../icons/ServiceIcon";
import { Callout } from "@/components/shared/callout";
import { CopyButton } from "@/components/shared/copy-button";
import {
  HelpTooltip,
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { FieldControl, invalidProps } from "./FieldControl";
import { RadioCard, RadioCardGroup } from "./RadioCard";

// The picture of a bucket choice: the S3 icon with a plus (new) or a link
// (existing) on its corner.
const bucketArt = (badge) => (
  <span className="relative">
    <ServiceIcon service="s3" className="size-8" />
    <span className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full bg-card text-foreground shadow-(--shadow-ring-sm) [&_svg]:size-3">
      {badge}
    </span>
  </span>
);

// Terraform state backend section of the wizard's Basics step (AWS only).
// Presentational: all state and the create-backend action live in the parent
// BasicConfigStep and are passed down as props. `bucketReadOnly`: the bucket
// the environment already has is shown as it is, and `onChangeBucket` offers
// the choice again (`onCancelChange` goes back to it). `existingOnly`: only
// another existing bucket can be named, never one created. `error`: the
// Basics error of a switched-on backend without a bucket. It sits on the
// bucket name field, or, while the bucket is still to be created, on the
// switch.
const TerraformBackendSection = ({
  newEnv,
  setNewEnv,
  credentials,
  useExistingBucket,
  setUseExistingBucket,
  backendCreated,
  creatingBackend,
  createdBucketName,
  onCreateBackend,
  bucketReadOnly,
  onChangeBucket,
  onCancelChange,
  existingOnly = false,
  error,
}) => {
  const id = useId();
  // Change replaces itself with the bucket name field, Cancel with Change,
  // Create backend with its outcome: focus moves there.
  const focusBucketField = useRef(false);
  const focusChange = useRef(false);
  const focusOutcome = useRef(false);
  const existing = existingOnly || useExistingBucket;
  const switchError = !existing && !backendCreated ? error : null;
  const backend = newEnv.terraformBackend;
  const credential = credentials.find((c) => c.id === newEnv.cloudCredentialId);
  const locked = backendCreated || creatingBackend;
  const preview =
    credential && newEnv.name
      ? `${credential.identifier}-terraform-${newEnv.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
      : "<account-id>-terraform-<environment>";

  return (
    <SettingsSection
      title="Terraform state backend"
      description={
        <>
          Optional. An S3 bucket in your account keeps the Terraform state.{" "}
          <span className="inline-flex align-text-bottom">
            <HelpTooltip label="About state locking">
              Uses S3 native locking, which needs Terraform 1.11 or later.
            </HelpTooltip>
          </span>
        </>
      }
      action={
        <Switch
          aria-label="Use a Terraform state backend"
          {...invalidProps(`${id}-bucket`, switchError)}
          checked={backend?.enabled || false}
          onCheckedChange={(checked) =>
            setNewEnv({
              ...newEnv,
              terraformBackend: {
                ...backend,
                enabled: checked,
                bucketName: backend?.bucketName || "",
                lockingMechanism: backend?.lockingMechanism || "s3",
                tableName: backend?.tableName || "",
              },
            })
          }
        />
      }
    >
      {backend?.enabled && bucketReadOnly ? (
        <SettingsRowGroup>
          <SettingsRow
            title="State bucket"
            description={
              <span className="inline-flex items-center gap-1">
                <code className="font-mono break-all">
                  {backend.bucketName}
                </code>
                <CopyButton
                  text={backend.bucketName}
                  label="Copy bucket name"
                  size="icon-xs"
                />
              </span>
            }
            control={
              <Button
                ref={(el) => {
                  if (el && focusChange.current) {
                    focusChange.current = false;
                    el.focus();
                  }
                }}
                variant="ghost"
                size="sm"
                aria-label="Change state bucket"
                // Stacked below sm: the label lines up with the row text.
                className="max-sm:-ml-2"
                onClick={() => {
                  focusBucketField.current = true;
                  onChangeBucket();
                }}
              >
                Change
              </Button>
            }
          />
        </SettingsRowGroup>
      ) : backend?.enabled ? (
        <>
          {existingOnly ? null : (
            <RadioCardGroup
              aria-label="State bucket"
              value={useExistingBucket ? "existing" : "create"}
              onValueChange={(value) =>
                setUseExistingBucket(value === "existing")
              }
              disabled={locked}
              className="sm:grid-cols-2"
            >
              <RadioCard
                id={`${id}-create`}
                value="create"
                title="Create a new bucket"
                description="OpenPrime creates it in your account now."
                art={bucketArt(<Plus />)}
              />
              <RadioCard
                id={`${id}-existing`}
                value="existing"
                title="Use an existing bucket"
                description="Point Terraform at a bucket you already have."
                art={bucketArt(<Link />)}
              />
            </RadioCardGroup>
          )}
          {existing ? (
            <SettingsRowGroup>
              <SettingsRow
                title="Bucket name"
                controlId={`${id}-bucket`}
                description="The S3 bucket that keeps the Terraform state."
                control={
                  <div className="flex w-full items-start gap-2 sm:w-auto">
                    <FieldControl id={`${id}-bucket`} error={error}>
                      <Input
                        ref={(el) => {
                          if (el && focusBucketField.current) {
                            focusBucketField.current = false;
                            el.focus();
                          }
                        }}
                        id={`${id}-bucket`}
                        className="font-mono"
                        placeholder="e.g. my-terraform-state"
                        value={backend?.bucketName || ""}
                        {...invalidProps(`${id}-bucket`, error)}
                        onChange={(e) =>
                          setNewEnv({
                            ...newEnv,
                            terraformBackend: {
                              ...backend,
                              bucketName: e.target.value,
                            },
                          })
                        }
                      />
                    </FieldControl>
                    {onCancelChange ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          focusChange.current = true;
                          onCancelChange();
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                }
              />
            </SettingsRowGroup>
          ) : backendCreated ? (
            <div
              ref={(el) => {
                if (el && focusOutcome.current) {
                  focusOutcome.current = false;
                  el.focus();
                }
              }}
              tabIndex={-1}
              className="outline-none"
            >
              <Callout
                variant="neutral"
                icon={CircleCheck}
                title="Backend created."
                action={
                  createdBucketName ? (
                    <CopyButton
                      text={createdBucketName}
                      label="Copy bucket name"
                    />
                  ) : null
                }
              >
                {createdBucketName ? (
                  <>
                    Bucket{" "}
                    <code className="font-mono text-xs break-all">
                      {createdBucketName}
                    </code>
                  </>
                ) : (
                  "The state bucket is ready."
                )}
              </Callout>
            </div>
          ) : (
            <>
              <SettingsRowGroup>
                <SettingsRow
                  title="Bucket name"
                  description={
                    <>
                      <code className="font-mono break-all">{preview}</code>
                      {newEnv.cloudCredentialId ? null : (
                        <span className="block">
                          Select credentials above first.
                        </span>
                      )}
                    </>
                  }
                  control={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        focusOutcome.current = true;
                        onCreateBackend();
                      }}
                      disabled={!newEnv.cloudCredentialId || creatingBackend}
                    >
                      {creatingBackend ? <Spinner aria-hidden /> : null}
                      Create backend
                    </Button>
                  }
                />
              </SettingsRowGroup>
              {switchError ? (
                <FieldError id={`${id}-bucket-error`}>{switchError}</FieldError>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </SettingsSection>
  );
};

export default TerraformBackendSection;
