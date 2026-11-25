import { useState } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";

import authService from "../../services/authService";
import { useToast } from "../../contexts/ToastContext";
import AwsIcon from "../icons/AwsIcon";
import { CopyButton } from "@/components/shared/copy-button";
import { RelativeTime } from "@/components/shared/format";
import { IconTile } from "@/components/shared/icon-tile";
import { ResourceActionsMenu } from "@/components/shared/resource-actions-menu";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const CloudCredentialsTab = ({
  credentials,
  onAddCredential,
  onEditCredential,
  onDeleteCredential,
}) => {
  const toast = useToast();
  const [testingId, setTestingId] = useState(null);
  const [lastValidatedMap, setLastValidatedMap] = useState({});

  const awsCredentials = credentials.filter((c) => c.provider === "aws");

  const handleTest = async (credential) => {
    setTestingId(credential.id);
    try {
      const result = await authService.post(
        `/cloud-credentials/${credential.id}/test`,
      );

      if (result.valid) {
        setLastValidatedMap((prev) => ({
          ...prev,
          [credential.id]: result.lastValidated,
        }));

        if (result.accountIdMismatch) {
          toast.warning(
            `Credentials are valid, but they belong to account ${result.accountId}. This credential is stored under ${credential.identifier}. Update the account ID to match.`,
          );
        } else {
          toast.success(
            `Credentials valid for account ${result.accountId || credential.identifier}`,
          );
        }
      } else {
        const isTemporary =
          result.reason === "temporary_failure" ||
          result.reason === "network_error";
        const message = result.message || "Validation failed";
        if (isTemporary) {
          toast.warning(`Could not verify credentials: ${message}`);
        } else {
          toast.error(`Credentials invalid: ${message}`);
        }
      }
    } catch (error) {
      if (error.status === 404) {
        toast.warning(
          "Credential testing isn't available yet. The backend needs an update first.",
        );
        return;
      }
      toast.error(error.message || "Couldn't test the credentials.");
    } finally {
      setTestingId(null);
    }
  };

  const addButton = (size) => (
    <Button size={size} onClick={() => onAddCredential("aws")}>
      <Plus aria-hidden />
      Add credentials
    </Button>
  );

  return (
    <SettingsSection
      title="AWS credentials"
      // One "Add credentials" at a time: the empty state carries its own.
      action={awsCredentials.length > 0 ? addButton("default") : null}
    >
      {awsCredentials.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No AWS credentials"
          description="Add an access key so OpenPrime can create the Terraform state bucket for you."
          action={addButton("sm")}
        />
      ) : (
        <SettingsRowGroup>
          {awsCredentials.map((credential) => {
            const lastValidated =
              lastValidatedMap[credential.id] || credential.lastValidated;
            const testing = testingId === credential.id;
            return (
              <SettingsRow
                key={credential.id}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <IconTile size="menu" className="text-foreground">
                      <AwsIcon />
                    </IconTile>
                    <span className="min-w-0 break-all">{credential.name}</span>
                    {credential.isDefault ? (
                      <Badge variant="tag">Default</Badge>
                    ) : null}
                  </span>
                }
                description={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      Account
                      <span className="font-mono text-foreground">
                        {credential.identifier}
                      </span>
                      <CopyButton
                        text={credential.identifier}
                        label="Copy account ID"
                        size="icon-xs"
                      />
                    </span>
                    <span>
                      {lastValidated ? (
                        <>
                          Checked <RelativeTime iso={lastValidated} />
                        </>
                      ) : (
                        "Not checked yet"
                      )}
                    </span>
                  </span>
                }
                control={
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Test ${credential.name}`}
                      onClick={() => handleTest(credential)}
                      disabled={testing}
                    >
                      {testing ? <Spinner aria-hidden /> : null}
                      Test
                    </Button>
                    <ResourceActionsMenu
                      label={`More actions for ${credential.name}`}
                      actions={[
                        {
                          label: "Edit",
                          icon: Pencil,
                          onSelect: () => onEditCredential(credential),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => onDeleteCredential(credential),
                        },
                      ]}
                    />
                  </div>
                }
              />
            );
          })}
        </SettingsRowGroup>
      )}
      <p className="text-xs text-muted-foreground">
        Azure and Google Cloud credentials are on the roadmap.
      </p>
    </SettingsSection>
  );
};

export default CloudCredentialsTab;
