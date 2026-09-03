import { useState } from "react";
import { Cloud, Edit2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import authService from "../../services/authService";
import { useToast } from "../../contexts/ToastContext";

const formatLastValidated = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

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
            `Credentials are valid, but they belong to account ${result.accountId} — this credential is stored under ${credential.identifier}. Update the Account ID to match.`,
          );
        } else {
          toast.success(
            `Credentials valid — Account: ${result.accountId || credential.identifier}`,
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
          "Credential testing isn't available yet — the backend needs to be updated first.",
        );
        return;
      }
      toast.error(error.message || "Failed to test credentials");
    } finally {
      setTestingId(null);
    }
  };

  const getLastValidated = (credential) =>
    lastValidatedMap[credential.id] || credential.last_validated;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="section-label">AWS Credentials</p>
        <button
          onClick={() => onAddCredential("aws")}
          className="btn-op-primary transition-all"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </button>
      </div>
      <div className="space-y-3">
        {awsCredentials.length === 0 ? (
          <div className="text-center py-8 transition-colors text-secondary">
            <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No AWS credentials configured</p>
            <p className="text-sm mt-1">
              Add your first credential to get started
            </p>
          </div>
        ) : (
          awsCredentials.map((credential) => {
            const lastValidated = getLastValidated(credential);
            const formatted = formatLastValidated(lastValidated);

            return (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 rounded-lg transition-colors bg-background border border-border"
              >
                <div className="flex items-center flex-1 gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center shrink-0">
                    <Cloud className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold transition-colors text-primary truncate">
                      {credential.name}
                      {credential.isDefault && (
                        <span className="ml-2 px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm transition-colors text-secondary">
                      Account: {credential.identifier}
                    </div>
                    <div className="text-xs transition-colors text-tertiary mt-0.5">
                      {formatted ? (
                        <>Last checked: {formatted}</>
                      ) : (
                        <>Not yet validated</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleTest(credential)}
                    disabled={testingId === credential.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated disabled:opacity-60"
                    title="Test credentials"
                  >
                    {testingId === credential.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Testing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm">Test</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onEditCredential(credential)}
                    className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCredential(credential)}
                    className="p-2 rounded-lg transition-colors text-tertiary hover:text-danger hover:bg-danger-muted"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CloudCredentialsTab;
