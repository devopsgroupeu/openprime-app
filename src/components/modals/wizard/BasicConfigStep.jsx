// src/components/modals/wizard/BasicConfigStep.js
import { useState, useEffect } from "react";
import {
  Cloud,
  MapPin,
  Type,
  Key,
  Database,
  Loader,
  CheckCircle,
  GitBranch,
  Tag,
  AlertTriangle,
} from "lucide-react";
import ProviderIcon from "../../icons/ProviderIcon";
import { useToast } from "../../../contexts/ToastContext";
import {
  PROVIDERS,
  createEmptyEnvironment,
} from "../../../config/environmentsConfig";
import { getAllProviders } from "../../../config/providersConfig";
import authService from "../../../services/authService";

const BasicConfigStep = ({ newEnv, setNewEnv, validationErrors = [] }) => {
  const toast = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [creatingBackend, setCreatingBackend] = useState(false);
  const [backendCreated, setBackendCreated] = useState(false);
  const [createdBucketName, setCreatedBucketName] = useState(null);
  const [useExistingBucket, setUseExistingBucket] = useState(false);

  useEffect(() => {
    if (newEnv.provider) {
      loadCredentials(newEnv.provider);
    }
  }, [newEnv.provider]);

  const loadCredentials = async (provider) => {
    try {
      setLoadingCredentials(true);
      const response = await authService.get(
        `/cloud-credentials?provider=${provider}`,
      );
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Failed to load credentials:", error);
      setCredentials([]);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors.find((error) => error.field === fieldName);
  };

  const handleProviderChange = (providerType) => {
    const emptyEnv = createEmptyEnvironment(providerType);
    setNewEnv({
      ...emptyEnv,
      name: newEnv.name,
      globalPrefix: newEnv.globalPrefix,
      cloudCredentialId: null,
    });
    setBackendCreated(false);
    setCreatedBucketName(null);
    setUseExistingBucket(false);
  };

  const handleCreateBackend = async () => {
    if (!newEnv.cloudCredentialId) {
      toast.error("Please select AWS credentials first");
      return;
    }

    if (!newEnv.name) {
      toast.error("Please enter environment name first");
      return;
    }

    if (
      newEnv.terraformBackend?.lockingMechanism === "dynamodb" &&
      !newEnv.terraformBackend?.tableName
    ) {
      toast.error("Please enter DynamoDB table name");
      return;
    }

    setCreatingBackend(true);

    try {
      const response = await authService.post(
        "/environments/terraform-backend/create",
        {
          region: newEnv.region,
          environmentName: newEnv.name,
          lockingMechanism: newEnv.terraformBackend.lockingMechanism,
          tableName: newEnv.terraformBackend.tableName,
          cloudCredentialId: newEnv.cloudCredentialId,
        },
      );

      if (response.success) {
        const bucketName = response.data?.bucketName;
        setBackendCreated(true);
        setCreatedBucketName(bucketName);

        // Update newEnv with the bucket name
        if (bucketName) {
          setNewEnv({
            ...newEnv,
            terraformBackend: {
              ...newEnv.terraformBackend,
              bucketName: bucketName,
            },
          });
          toast.success(`Terraform backend created: ${bucketName}`, {
            duration: 8000,
          });
        } else {
          toast.success("Terraform backend resources created successfully");
        }
      } else {
        toast.error(response.error || "Failed to create backend resources");
      }
    } catch (error) {
      const errorMessage =
        error.message || "Failed to create backend resources";
      toast.error(errorMessage);
    } finally {
      setCreatingBackend(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Environment Name */}
      <div className="p-6 rounded-2xl border bg-surface border-border">
        <div className="flex items-center mb-4">
          <Type className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Environment Name
          </label>
          <span className="ml-2 text-danger text-sm">*</span>
        </div>
        <input
          type="text"
          className={`w-full px-4 py-3 text-lg transition-colors ${
            getFieldError("name") ? "border-danger" : "border-border"
          }`}
          placeholder="e.g., production, staging, development"
          value={newEnv.name}
          onChange={(e) => {
            const value = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            setNewEnv({ ...newEnv, name: value });
          }}
        />
        {getFieldError("name") ? (
          <p className="text-danger text-xs mt-2">
            {getFieldError("name").message}
          </p>
        ) : (
          <p className="text-xs mt-2 text-tertiary">
            Lowercase alphanumeric name for this environment (e.g., production,
            staging)
          </p>
        )}
      </div>

      {/* Global Prefix */}
      <div className="p-6 rounded-2xl border bg-surface border-border">
        <div className="flex items-center mb-4">
          <Tag className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Global Prefix
          </label>
          <span className="ml-2 text-danger text-sm">*</span>
        </div>
        <input
          type="text"
          className={`w-full px-4 py-3 text-lg transition-colors ${
            getFieldError("globalPrefix") ? "border-danger" : "border-border"
          }`}
          placeholder="e.g., myapp-, prod-, company-"
          value={newEnv.globalPrefix || ""}
          onChange={(e) => {
            const newValue = e.target.value;
            const currentValue = newEnv.globalPrefix || "";

            // Detect if user is deleting (backspace)
            if (newValue.length < currentValue.length) {
              // Remove the dash first, then remove last char, then add dash back
              const baseWithoutDash = currentValue.replace(/-$/, "");
              const newBase = baseWithoutDash.slice(0, -1);
              const finalValue = newBase ? `${newBase}-` : "";
              setNewEnv({ ...newEnv, globalPrefix: finalValue });
            } else {
              // User is typing - sanitize and add dash
              const baseValue = newValue
                .replace(/-+$/, "")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
              const finalValue = baseValue ? `${baseValue}-` : "";
              setNewEnv({ ...newEnv, globalPrefix: finalValue });
            }
          }}
        />
        {getFieldError("globalPrefix") ? (
          <p className="text-danger text-xs mt-2">
            {getFieldError("globalPrefix").message}
          </p>
        ) : (
          <p className="text-xs mt-2 text-tertiary">
            Prefix applied to all resource names (lowercase, alphanumeric,
            auto-appends dash)
          </p>
        )}
      </div>

      {/* Cloud Provider */}
      <div className="p-6 rounded-2xl border bg-surface border-border">
        <div className="flex items-center mb-4">
          <Cloud className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Cloud Provider
          </label>
        </div>
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          }}
        >
          {getAllProviders().map((provider) => (
            <button
              key={provider.value}
              onClick={() => handleProviderChange(provider.value)}
              disabled={!provider.enabled}
              className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 transition-all ${
                newEnv.provider === provider.value
                  ? "border-primary text-accent"
                  : provider.enabled
                    ? "border-border text-secondary hover:border-primary/50 hover:text-primary"
                    : "border-border text-tertiary cursor-not-allowed opacity-50"
              }`}
            >
              <ProviderIcon
                provider={provider.value}
                className={`w-7 h-7 ${provider.value === "aws" ? "text-[#FF9900]" : ""}`}
              />
              <span className="text-sm font-bold">{provider.name}</span>
              {!provider.enabled && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
                  Disabled
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Credentials Selection */}
      {newEnv.provider && (
        <div className="p-6 rounded-2xl border bg-surface border-border">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 mr-2 text-accent" />
            <label className="text-sm font-semibold text-label">
              Cloud Credentials (Optional)
            </label>
          </div>

          {loadingCredentials ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : credentials.length > 0 ? (
            <div>
              <select
                className="w-full px-4 py-3 text-lg transition-colors"
                value={newEnv.cloudCredentialId || ""}
                onChange={(e) =>
                  setNewEnv({
                    ...newEnv,
                    cloudCredentialId: e.target.value || null,
                  })
                }
              >
                <option value="">No credentials (manual configuration)</option>
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} - {cred.identifier}
                    {cred.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-2 text-tertiary">
                Select saved credentials to use for this environment
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg border-2 border-dashed text-center border-border bg-background-secondary text-tertiary">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-2">No saved credentials found</p>
              <p className="text-xs">
                Add credentials in Settings to use them for deployments
              </p>
            </div>
          )}
        </div>
      )}

      {/* Region Selection */}
      <div className="p-6 rounded-2xl border bg-surface border-border">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Deployment Region
          </label>
        </div>

        {newEnv.provider && PROVIDERS[newEnv.provider] ? (
          <div>
            <select
              className="w-full px-4 py-3 text-lg transition-colors"
              value={newEnv.region}
              onChange={(e) => setNewEnv({ ...newEnv, region: e.target.value })}
            >
              {PROVIDERS[newEnv.provider].regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <p className="text-xs mt-2 text-tertiary">
              Choose the region closest to your users for optimal performance
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-dashed text-center border-border bg-background-secondary text-tertiary">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a cloud provider first</p>
          </div>
        )}
      </div>

      {/* Terraform Backend Configuration */}
      {newEnv.provider === "aws" && (
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
            Automatically create S3 bucket and optional DynamoDB table for
            Terraform state management
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
                    Please select cloud credentials above before creating
                    backend resources
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
                            {newEnv.name
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "-")}
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
                      Using S3 native locking (requires Terraform 1.11 or
                      higher).
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
                      onClick={handleCreateBackend}
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
      )}

      {/* Git Repository Configuration */}
      <div className="p-6 rounded-2xl border bg-surface border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-accent" />
            <label className="text-sm font-semibold text-label">
              Git Repository (Optional)
            </label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={newEnv.gitRepository?.enabled || false}
              onChange={(e) =>
                setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    enabled: e.target.checked,
                    url: newEnv.gitRepository?.url || "",
                    branch: newEnv.gitRepository?.branch || "main",
                    sshKey: newEnv.gitRepository?.sshKey || "",
                  },
                })
              }
            />
            <div className="w-11 h-6 rounded-full peer transition-colors bg-border-strong peer-checked:bg-primary">
              <div
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                  newEnv.gitRepository?.enabled ? "translate-x-5" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>

        <p className="text-xs mb-4 text-tertiary">
          Configure Git repository for infrastructure code storage and version
          control
        </p>

        {newEnv.gitRepository?.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-label block mb-2">
                Repository URL
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 transition-colors"
                placeholder="git@github.com:organization/repository.git"
                value={newEnv.gitRepository?.url || ""}
                onChange={(e) =>
                  setNewEnv({
                    ...newEnv,
                    gitRepository: {
                      ...newEnv.gitRepository,
                      url: e.target.value,
                    },
                  })
                }
              />
              <p className="text-xs mt-1 text-tertiary">
                SSH URL of the Git repository for infrastructure code
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-label block mb-2">
                Target Branch / Revision
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 transition-colors"
                placeholder="main"
                value={newEnv.gitRepository?.branch || ""}
                onChange={(e) =>
                  setNewEnv({
                    ...newEnv,
                    gitRepository: {
                      ...newEnv.gitRepository,
                      branch: e.target.value,
                    },
                  })
                }
              />
              <p className="text-xs mt-1 text-tertiary">
                Branch or Git revision ArgoCD will track (e.g. main, HEAD,
                v1.2.0)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-label block mb-2">
                SSH Private Key (Deploy Key)
              </label>
              <textarea
                className="w-full px-4 py-2 font-mono text-xs transition-colors"
                placeholder="Paste your SSH private key here (PEM format)"
                rows={8}
                value={newEnv.gitRepository?.sshKey || ""}
                onChange={(e) =>
                  setNewEnv({
                    ...newEnv,
                    gitRepository: {
                      ...newEnv.gitRepository,
                      sshKey: e.target.value,
                    },
                  })
                }
              />
              <p className="text-xs mt-1 text-tertiary">
                Private SSH key with read access to the repository
              </p>
            </div>

            {/* Deployment prerequisite callout */}
            <div className="p-5 rounded-xl border mb-4 bg-warning-muted border-warning text-warning">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
                <div className="space-y-3 min-w-0">
                  <div>
                    <p className="text-sm font-bold mb-0.5">
                      Deployment Prerequisites
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90">
                    To enable automated infrastructure deployment via CI/CD, the
                    following secrets must be configured within your
                    repository&apos;s environment variables. These credentials
                    allow the pipeline to authenticate with your cloud provider
                    and securely access private Git resources.
                  </p>

                  <ul className="text-[11px] space-y-2 list-none">
                    <li className="leading-relaxed">
                      <code className="px-1 py-0.5 rounded font-mono bg-background">
                        AWS_ACCESS_KEY_ID
                      </code>{" "}
                      &{" "}
                      <code className="px-1 py-0.5 rounded font-mono bg-background">
                        AWS_SECRET_ACCESS_KEY
                      </code>
                      <span className="block mt-1 opacity-80">
                        IAM credentials with the necessary permissions to
                        provision and manage the resources.
                      </span>
                    </li>
                    <li className="leading-relaxed">
                      <code className="px-1 py-0.5 rounded font-mono bg-background">
                        TF_VAR_git_repo_ssh_key
                      </code>
                      <span className="block mt-1 opacity-80">
                        A private SSH key (Deployment Key) used by Terraform and
                        ArgoCD to authenticate against private repositories.
                      </span>
                    </li>
                  </ul>

                  <div className="p-2 rounded text-[11px] border bg-background border-border">
                    <span className="font-bold mr-1 uppercase text-[10px]">
                      Security Note:
                    </span>
                    <span className="italic opacity-90">
                      These variables must be stored as encrypted Secrets (e.g.,
                      GitHub Actions Secrets) and should never be logged or
                      committed to source control.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {newEnv.name &&
        newEnv.globalPrefix &&
        newEnv.provider &&
        newEnv.region && (
          <div className="p-4 rounded-lg border bg-success-muted border-success text-success">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
              <span className="text-sm font-medium">
                Ready to create &quot;{newEnv.name}&quot; (prefix:{" "}
                {newEnv.globalPrefix}) on {PROVIDERS[newEnv.provider]?.name} in{" "}
                {
                  PROVIDERS[newEnv.provider]?.regions.find(
                    (r) => r.value === newEnv.region,
                  )?.label
                }
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

export default BasicConfigStep;
