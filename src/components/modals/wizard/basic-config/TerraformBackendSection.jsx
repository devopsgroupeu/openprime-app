import { useId } from "react";
import { CircleCheck } from "lucide-react";
import { Callout } from "@/components/shared/callout";
import { CopyButton } from "@/components/shared/copy-button";
import {
  HelpTooltip,
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { RadioCard, RadioCardGroup } from "./RadioCard";

// Terraform state backend section of the wizard's Basics step (AWS only).
// Presentational: all state and the create-backend action live in the parent
// BasicConfigStep and are passed down as props.
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
}) => {
  const id = useId();
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
      {backend?.enabled && (
        <>
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
            />
            <RadioCard
              id={`${id}-existing`}
              value="existing"
              title="Use an existing bucket"
              description="Point Terraform at a bucket you already have."
            />
          </RadioCardGroup>
          {useExistingBucket ? (
            <SettingsRowGroup>
              <SettingsRow
                title="Bucket name"
                controlId={`${id}-bucket`}
                description="The S3 bucket that keeps the Terraform state."
                control={
                  <Input
                    id={`${id}-bucket`}
                    className="font-mono sm:w-72"
                    placeholder="e.g. my-terraform-state"
                    value={backend?.bucketName || ""}
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
                }
              />
            </SettingsRowGroup>
          ) : backendCreated ? (
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
          ) : (
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
                    onClick={onCreateBackend}
                    disabled={!newEnv.cloudCredentialId || creatingBackend}
                  >
                    {creatingBackend ? <Spinner aria-hidden /> : null}
                    Create backend
                  </Button>
                }
              />
            </SettingsRowGroup>
          )}
        </>
      )}
    </SettingsSection>
  );
};

export default TerraformBackendSection;
