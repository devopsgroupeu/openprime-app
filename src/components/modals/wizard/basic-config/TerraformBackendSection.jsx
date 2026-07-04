import { Database, Loader, CheckCircle } from "lucide-react";

// Terraform backend card of the wizard's Basic Configuration step (AWS only).
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
  return (
    <div className="p-6 rounded-2xl border bg-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Terraform Backend (Optional)
          </label>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={newEnv.terraformBackend?.enabled || false}
            onChange={(e) =>
              setNewEnv({
                ...newEnv,
                terraformBackend: {
                  ...newEnv.terraformBackend,
                  enabled: e.target.checked,
                  bucketName: newEnv.terraformBackend?.bucketName || "",
                  lockingMechanism:
                    newEnv.terraformBackend?.lockingMechanism || "s3",
                  tableName: newEnv.terraformBackend?.tableName || "",
                },
              })
            }
          />
          <div className="w-11 h-6 rounded-full peer transition-colors bg-border-strong peer-checked:bg-primary">
            <div
              className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                newEnv.terraformBackend?.enabled ? "translate-x-5" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>

      <p className="text-xs mb-4 text-tertiary">
        Automatically create S3 bucket and optional DynamoDB table for Terraform
        state management
      </p>

      {newEnv.terraformBackend?.enabled && !newEnv.cloudCredentialId && (
        <div className="p-4 rounded-lg border mb-4 bg-warning-muted border-warning text-warning">
          <div className="flex items-start">
            <Database className="w-4 h-4 mr-2 mt-0.5" />
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-medium">
                AWS credentials are required to create Terraform backend
                resources
              </p>
              <p className="text-xs">
                Please select cloud credentials above before creating backend
                resources
              </p>
            </div>
          </div>
        </div>
      )}

      {newEnv.terraformBackend?.enabled && (
        <div className="space-y-4 mt-4">
          {/* Toggle between Create New vs Use Existing Bucket */}
          <div>
            <label className="text-sm font-semibold text-label block mb-2">
              S3 Bucket Configuration
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseExistingBucket(false)}
                disabled={backendCreated || creatingBackend}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !useExistingBucket
                    ? "bg-primary text-inverse"
                    : "bg-background-secondary text-secondary hover:bg-surface-elevated"
                } ${backendCreated || creatingBackend ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Create New Bucket
              </button>
              <button
                type="button"
                onClick={() => setUseExistingBucket(true)}
                disabled={backendCreated || creatingBackend}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  useExistingBucket
                    ? "bg-primary text-inverse"
                    : "bg-background-secondary text-secondary hover:bg-surface-elevated"
                } ${backendCreated || creatingBackend ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Use Existing Bucket
              </button>
            </div>
          </div>

          {/* S3 Bucket Name Display/Input */}
          {!useExistingBucket ? (
            // Create New Bucket Section
            <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
              <div className="flex items-start">
                <Database className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    S3 Bucket Name (Auto-generated)
                  </p>
                  <p className="text-xs mt-1">
                    Format:{" "}
                    <code className="font-mono">
                      &lt;AWS_ACCOUNT_ID&gt;-terraform-&lt;environment-name&gt;
                    </code>
                  </p>
                  {newEnv.name &&
                    credentials.find(
                      (c) => c.id === newEnv.cloudCredentialId,
                    ) && (
                      <p className="text-xs mt-1 font-mono">
                        Preview:{" "}
                        {
                          credentials.find(
                            (c) => c.id === newEnv.cloudCredentialId,
                          )?.identifier
                        }
                        -terraform-
                        {newEnv.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}
                      </p>
                    )}
                </div>
              </div>
            </div>
          ) : (
            // Use Existing Bucket Section
            <div>
              <label className="text-sm font-semibold text-label block mb-2">
                S3 Bucket Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 transition-colors"
                placeholder="e.g., my-terraform-state-bucket"
                value={newEnv.terraformBackend?.bucketName || ""}
                onChange={(e) =>
                  setNewEnv({
                    ...newEnv,
                    terraformBackend: {
                      ...newEnv.terraformBackend,
                      bucketName: e.target.value,
                    },
                  })
                }
              />
              <p className="text-xs mt-1 text-tertiary">
                Enter the name of an existing S3 bucket for Terraform state
                storage
              </p>
            </div>
          )}

          <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
            <div className="flex items-start">
              <Database className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">State Locking</p>
                <p className="text-xs mt-1">
                  Using S3 native locking (requires Terraform 1.11 or higher).
                </p>
              </div>
            </div>
          </div>

          {/* Create Backend Button - Only show when creating new bucket */}
          {!useExistingBucket && (
            <>
              {backendCreated ? (
                <div className="p-4 rounded-lg border bg-success-muted border-success text-success">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        Backend resources created successfully
                      </p>
                      {createdBucketName && (
                        <p className="text-xs mt-1 font-mono opacity-90">
                          S3 Bucket: {createdBucketName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onCreateBackend}
                  disabled={!newEnv.cloudCredentialId || creatingBackend}
                  className="btn-op-primary w-full"
                >
                  {creatingBackend ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Creating Backend Resources...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 mr-2" />
                      Create Backend Resources
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TerraformBackendSection;
