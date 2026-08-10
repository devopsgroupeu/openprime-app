// src/components/modals/wizard/BasicConfigStep.js
import { useState, useEffect } from "react";
import { Cloud, MapPin, Type, Key, Tag } from "lucide-react";
import ProviderIcon from "../../icons/ProviderIcon";
import { useToast } from "../../../contexts/ToastContext";
import {
  PROVIDERS,
  createEmptyEnvironment,
} from "../../../config/environmentsConfig";
import { getAllProviders } from "../../../config/providersConfig";
import authService from "../../../services/authService";
import TerraformBackendSection from "./basic-config/TerraformBackendSection";
import GitRepositorySection from "./basic-config/GitRepositorySection";

// isEditMode locks Environment Name and Global Prefix: both are baked into every
// generated Terraform resource name, so changing them on an existing environment
// makes the next apply a full destroy/recreate.
const BasicConfigStep = ({
  newEnv,
  setNewEnv,
  validationErrors = [],
  isEditMode = false,
}) => {
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
          readOnly={isEditMode}
          disabled={isEditMode}
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
            {isEditMode
              ? "Fixed after creation — it names every generated Terraform resource."
              : "Lowercase alphanumeric name for this environment (e.g., production, staging)"}
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
          readOnly={isEditMode}
          disabled={isEditMode}
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
            {isEditMode
              ? "Fixed after creation — changing it would rename every Terraform resource."
              : "Prefix applied to all resource names (lowercase, alphanumeric, auto-appends dash)"}
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
                  Roadmap
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
        <TerraformBackendSection
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          credentials={credentials}
          useExistingBucket={useExistingBucket}
          setUseExistingBucket={setUseExistingBucket}
          backendCreated={backendCreated}
          creatingBackend={creatingBackend}
          createdBucketName={createdBucketName}
          onCreateBackend={handleCreateBackend}
        />
      )}

      {/* Git Repository Configuration */}
      <GitRepositorySection newEnv={newEnv} setNewEnv={setNewEnv} />

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
