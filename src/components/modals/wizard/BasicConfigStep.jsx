// src/components/modals/wizard/BasicConfigStep.js
import { useState, useEffect, useRef } from "react";
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

// Derives the suggested Global Prefix from Environment Name, e.g. "demo" ->
// "demo-". Mirrors the sanitization already applied to the name field, plus
// a leading-digit strip: RDS/Aurora identifiers and ElastiCache replication
// group ids require a letter first (see GLOBAL_PREFIX_RE below), which is
// stricter than the name field's own [a-z0-9] rule, so "2024-app" as a name
// must not suggest "2024app-" as a prefix.
const slugify = (value) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const derivePrefix = (name) => {
  const slug = slugify(name).replace(/^[0-9]+/, "");
  return slug ? `${slug}-` : "";
};

export const GLOBAL_PREFIX_RE = /^[a-z](-?[a-z0-9]+)*-?$/;

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
  // Global Prefix auto-suggests from the name until the user hand-edits it.
  // Initialized from the current values so a resumed draft (or an
  // already-customized prefix) isn't clobbered on mount.
  const prefixEditedRef = useRef(
    (newEnv.globalPrefix || "") !== derivePrefix(newEnv.name),
  );
  const trailingDashIsRealRef = useRef(false);

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
            setNewEnv({
              ...newEnv,
              name: value,
              // Keep suggesting a prefix until the user edits it by hand.
              ...(prefixEditedRef.current
                ? {}
                : { globalPrefix: derivePrefix(value) }),
            });
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
          placeholder="e.g., myapp-, prod-, us-app-, app-test-"
          value={newEnv.globalPrefix || ""}
          readOnly={isEditMode}
          disabled={isEditMode}
          onChange={(e) => {
            // Any direct edit permanently stops the name -> prefix auto-sync.
            prefixEditedRef.current = true;
            const newValue = e.target.value;
            const currentValue = newEnv.globalPrefix || "";
            const dashIsReal = trailingDashIsRealRef.current;

            // Both quirks below stem from the same cause: the field always
            // shows a trailing dash - cosmetic (auto-appended) unless
            // dashIsReal says the user's last keystroke put a real one
            // there - so edits made right at the end actually land before
            // or after that dash rather than where the user thinks they
            // are. Everywhere else (deleting or inserting in the middle),
            // newValue already reflects exactly what the user did and can
            // be sanitized as-is.
            let rawBase;
            let nextDashIsReal = false;
            if (
              newValue.length < currentValue.length &&
              currentValue.endsWith("-") &&
              !dashIsReal &&
              newValue === currentValue.slice(0, -1)
            ) {
              // Backspace at the very end deletes the auto-appended dash
              // itself first. Without help, that dash would just reappear
              // on re-render and "eat" the keypress - so drop the
              // preceding real character too, matching one backspace to
              // one deleted character.
              rawBase = newValue.slice(0, -1);
            } else if (
              newValue.length > currentValue.length &&
              currentValue.endsWith("-") &&
              newValue.startsWith(currentValue)
            ) {

              const typed = newValue.slice(currentValue.length);
              rawBase = dashIsReal
                ? currentValue + typed
                : currentValue.slice(0, -1) + typed;
              nextDashIsReal = typed.endsWith("-");
            } else {
              rawBase = newValue;
            }

            let sanitized = rawBase
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "")
              .replace(/^[^a-z]+/, "")
              .replace(/-{2,}/g, "-");
            if (!nextDashIsReal) {
              sanitized = sanitized.replace(/-+$/, "");
            }

            const baseValue = sanitized;
            const dashAlreadyTrailing = nextDashIsReal && baseValue.endsWith("-");
            const finalValue = !baseValue
              ? ""
              : dashAlreadyTrailing
                ? baseValue
                : `${baseValue}-`;
            trailingDashIsRealRef.current = dashAlreadyTrailing;
            setNewEnv({ ...newEnv, globalPrefix: finalValue });
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
              : "Prefix applied to all resource names (lowercase, alphanumeric with dashes, auto-appends dash)"}
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
