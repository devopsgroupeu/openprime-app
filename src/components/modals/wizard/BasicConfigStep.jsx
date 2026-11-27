// src/components/modals/wizard/BasicConfigStep.js
import { useState, useEffect, useId, useRef } from "react";
import { Link } from "react-router";
import { TriangleAlert } from "lucide-react";
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
import OtherSpecificationsSection from "./basic-config/OtherSpecificationsSection";
import { RadioCard, RadioCardGroup } from "./basic-config/RadioCard";
import { FieldControl, invalidProps } from "./basic-config/FieldControl";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/describe-error";
import { cn } from "@/lib/utils";

// Short provider names for the radio cards.
const PROVIDER_NAMES = {
  aws: "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
  onpremise: "On-premises",
};

// NativeSelect hugs its content; in a row it fills the control column instead.
const FULL_WIDTH_SELECT = "[&>[data-slot=native-select-wrapper]]:w-full";

// Derives the suggested Global Prefix from Environment Name, e.g. "demo" ->
// "demo-". Mirrors the sanitization already applied to the name field, plus
// a leading-digit strip: RDS/Aurora identifiers and ElastiCache replication
// group ids require a letter first (see GLOBAL_PREFIX_RE below), which is
// stricter than the name field's own [a-z0-9] rule, so "2024-app" as a name
// must not suggest "2024app-" as a prefix.
//
// This sanitizer also guarantees a non-empty prefix ends in "-":
// elasticache.tf's replication_group_id/subnet_group_name/parameter_group_name
// rely on that trailing dash as their own separator and add none of their
// own. environmentValidator.js and openprime-infra-templates' _variables.tf
// validation both require it too now, so this isn't the only enforcement
// point any more - but it's still the one that keeps a direct API caller
// (who bypasses this file entirely) from ever being the first to notice.
const slugify = (value) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const derivePrefix = (name) => {
  const slug = slugify(name).replace(/^[0-9]+/, "");
  return slug ? `${slug}-` : "";
};

// Only read by tests - nothing here validates against it at runtime. Keep
// this in sync with environmentValidator.js's GLOBAL_PREFIX_RE by hand: that
// one had to change shape to avoid catastrophic backtracking
// (^[a-z](-?[a-z0-9]+)*-?$ nests a `+` inside a `*`), and to require the
// trailing "-" rather than merely allow it, matching
// openprime-infra-templates' _variables.tf validation (openprime-app-backend#30).
export const GLOBAL_PREFIX_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*-$/;

// isEditMode locks Environment Name and Global Prefix: both are baked into every
// generated Terraform resource name, so changing them on an existing environment
// makes the next apply a full destroy/recreate. `savedBucket`: the state bucket
// the edited environment was saved with. Its Terraform state is there, so the
// bucket can only change to another existing one; a new bucket would leave the
// state behind.
const BasicConfigStep = ({
  newEnv,
  setNewEnv,
  sshKeys,
  validationErrors = [],
  isEditMode = false,
  savedBucket,
}) => {
  const toast = useToast();
  const id = useId();
  const [credentials, setCredentials] = useState([]);
  // Loading from the first render, so "No saved credentials" never flashes.
  const [loadingCredentials, setLoadingCredentials] = useState(
    Boolean(newEnv.provider),
  );
  const [creatingBackend, setCreatingBackend] = useState(false);
  const [backendCreated, setBackendCreated] = useState(false);
  const [createdBucketName, setCreatedBucketName] = useState(null);
  // A bucket the environment already has (edit mode, a restored draft, back
  // from a later step) is shown as it is, never offered for creation again.
  const hasBucket = Boolean(newEnv.terraformBackend?.bucketName?.trim());
  const [bucketReadOnly, setBucketReadOnly] = useState(hasBucket);
  const [useExistingBucket, setUseExistingBucket] = useState(hasBucket);
  // The bucket shown before Change, which Cancel goes back to.
  const [bucketBeforeChange, setBucketBeforeChange] = useState(null);
  // Global Prefix auto-suggests from the name until the user hand-edits it.
  // Initialized from the current values so a resumed draft (or an
  // already-customized prefix) isn't clobbered on mount.
  const prefixEditedRef = useRef(
    (newEnv.globalPrefix || "") !== derivePrefix(newEnv.name),
  );
  const trailingDashIsRealRef = useRef(false);
  // The last keystroke in Name was left out (hyphen, space, symbol).
  const [nameDropped, setNameDropped] = useState(false);

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

  const setBucketName = (bucketName) =>
    setNewEnv({
      ...newEnv,
      terraformBackend: { ...newEnv.terraformBackend, bucketName },
    });

  // A name typed for an existing bucket is not the bucket to create.
  const chooseExistingBucket = (existing) => {
    setUseExistingBucket(existing);
    if (!existing && !backendCreated) setBucketName("");
  };

  const changeBucket = () => {
    setBucketBeforeChange(newEnv.terraformBackend.bucketName);
    setBucketReadOnly(false);
  };

  const cancelBucketChange = () => {
    setBucketName(bucketBeforeChange);
    setUseExistingBucket(true);
    setBucketReadOnly(true);
    setBucketBeforeChange(null);
  };

  const errorFor = (fieldName) =>
    validationErrors.find((error) => error.field === fieldName)?.message;

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
    setBucketReadOnly(false);
  };

  const handleCreateBackend = async () => {
    if (!newEnv.cloudCredentialId) {
      toast.error("Select AWS credentials first.");
      return;
    }

    if (!newEnv.name) {
      toast.error("Enter an environment name first.");
      return;
    }

    if (
      newEnv.terraformBackend?.lockingMechanism === "dynamodb" &&
      !newEnv.terraformBackend?.tableName
    ) {
      toast.error("Enter a DynamoDB table name.");
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

        // Update newEnv with the bucket name. The section shows the outcome
        // inline, so no success toast.
        if (bucketName) {
          setNewEnv({
            ...newEnv,
            terraformBackend: {
              ...newEnv.terraformBackend,
              bucketName: bucketName,
            },
          });
        }
      } else {
        toast.error(response.error || "Couldn't create the state backend.");
      }
    } catch (error) {
      toast.error(describeError(error, "create the state backend"));
    } finally {
      setCreatingBackend(false);
    }
  };

  const nameError = errorFor("name");
  const prefixError = errorFor("globalPrefix");
  const regionError = errorFor("region");
  const domainError = errorFor("domain");
  const regions = PROVIDERS[newEnv.provider]?.regions;
  const prefix = newEnv.globalPrefix || "";

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection
        title="Environment"
        description="Names that end up in every resource OpenPrime generates."
      >
        <SettingsRowGroup>
          <SettingsRow
            title="Name"
            controlId={`${id}-name`}
            description={
              isEditMode ? undefined : (
                // Announced: the field leaves out what it cannot keep.
                <span
                  aria-live="polite"
                  className={cn(
                    nameDropped &&
                      "inline-flex items-start gap-1.5 text-foreground",
                  )}
                >
                  {nameDropped ? (
                    <>
                      <TriangleAlert
                        aria-hidden
                        className="mt-px size-3.5 shrink-0 text-warning"
                      />
                      Hyphens, spaces and symbols are not allowed in the name.
                    </>
                  ) : (
                    "Lowercase letters and numbers, no hyphens, e.g. production."
                  )}
                </span>
              )
            }
            lockedReason={
              isEditMode
                ? "Fixed after creation: it names every Terraform resource."
                : undefined
            }
            control={
              <FieldControl id={`${id}-name`} error={nameError}>
                <Input
                  id={`${id}-name`}
                  placeholder="e.g. production"
                  autoComplete="off"
                  value={newEnv.name}
                  disabled={isEditMode}
                  {...invalidProps(`${id}-name`, nameError)}
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "");
                    setNameDropped(value.length < e.target.value.length);
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
              </FieldControl>
            }
          />
          <SettingsRow
            title="Resource prefix"
            controlId={`${id}-prefix`}
            description={
              isEditMode ? undefined : prefix ? (
                <>
                  Resources are named{" "}
                  <code className="font-mono">{prefix}vpc</code>,{" "}
                  <code className="font-mono">{prefix}eks-cluster</code>.
                </>
              ) : (
                "Starts every resource name. Lowercase letters, numbers and hyphens."
              )
            }
            lockedReason={
              isEditMode
                ? "Fixed after creation: changing it would rename every resource."
                : undefined
            }
            control={
              <FieldControl id={`${id}-prefix`} error={prefixError}>
                <Input
                  id={`${id}-prefix`}
                  className="font-mono"
                  placeholder="e.g. myapp-"
                  autoComplete="off"
                  value={prefix}
                  disabled={isEditMode}
                  {...invalidProps(`${id}-prefix`, prefixError)}
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
                    const dashAlreadyTrailing =
                      nextDashIsReal && baseValue.endsWith("-");
                    const finalValue = !baseValue
                      ? ""
                      : dashAlreadyTrailing
                        ? baseValue
                        : `${baseValue}-`;
                    trailingDashIsRealRef.current = dashAlreadyTrailing;
                    setNewEnv({ ...newEnv, globalPrefix: finalValue });
                  }}
                />
              </FieldControl>
            }
          />
        </SettingsRowGroup>
      </SettingsSection>

      <SettingsSection
        title="Cloud"
        description="Where OpenPrime provisions this environment."
      >
        <RadioCardGroup
          aria-label="Cloud provider"
          value={newEnv.provider}
          onValueChange={handleProviderChange}
          className="grid-cols-2 md:grid-cols-4"
        >
          {getAllProviders().map((provider) => (
            <RadioCard
              key={provider.value}
              id={`${id}-provider-${provider.value}`}
              value={provider.value}
              disabled={!provider.enabled}
              title={PROVIDER_NAMES[provider.value] ?? provider.name}
              badge={
                provider.enabled ? null : <Badge variant="tag">Roadmap</Badge>
              }
              art={
                <ProviderIcon
                  provider={provider.value}
                  // Brand logos keep their full official colors even on
                  // Roadmap cards; only the neutral Server icon is muted.
                  className={cn(
                    "size-8",
                    provider.enabled
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                />
              }
            />
          ))}
        </RadioCardGroup>
        <SettingsRowGroup>
          <SettingsRow
            title="Region"
            controlId={`${id}-region`}
            description="Pick the region closest to your users."
            control={
              regions ? (
                <FieldControl id={`${id}-region`} error={regionError}>
                  {/* The region code sits inside the field, left of the chevron. */}
                  <div className={cn("relative", FULL_WIDTH_SELECT)}>
                    <NativeSelect
                      id={`${id}-region`}
                      className="pr-24"
                      value={newEnv.region}
                      {...invalidProps(`${id}-region`, regionError)}
                      onChange={(e) =>
                        setNewEnv({ ...newEnv, region: e.target.value })
                      }
                    >
                      {regions.map((region) => (
                        <NativeSelectOption
                          key={region.value}
                          value={region.value}
                        >
                          {region.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 right-9 -translate-y-1/2 font-mono text-xs text-muted-foreground"
                    >
                      {newEnv.region}
                    </span>
                  </div>
                </FieldControl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a provider first.
                </p>
              )
            }
          />
          {newEnv.provider && (
            <SettingsRow
              title="Credentials (optional)"
              controlId={credentials.length ? `${id}-credentials` : undefined}
              description="Lets OpenPrime create the Terraform state bucket in your account."
              control={
                loadingCredentials ? (
                  <Skeleton className="h-8 w-full sm:w-72" />
                ) : credentials.length > 0 ? (
                  <div className={cn("w-full sm:w-72", FULL_WIDTH_SELECT)}>
                    <NativeSelect
                      id={`${id}-credentials`}
                      value={newEnv.cloudCredentialId || ""}
                      onChange={(e) =>
                        setNewEnv({
                          ...newEnv,
                          cloudCredentialId: e.target.value || null,
                        })
                      }
                    >
                      <NativeSelectOption value="">
                        No credentials
                      </NativeSelectOption>
                      {credentials.map((cred) => (
                        <NativeSelectOption key={cred.id} value={cred.id}>
                          {cred.name} - {cred.identifier}
                          {cred.isDefault ? " (default)" : ""}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No saved credentials.{" "}
                    <Link
                      to="/settings/cloud-credentials"
                      className="rounded-sm text-foreground underline underline-offset-2 outline-none hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Add credentials
                    </Link>
                  </p>
                )
              }
            />
          )}
        </SettingsRowGroup>
      </SettingsSection>

      {/* Deliberately not locked in edit mode: a customer usually delegates a
          domain after trying the product, and should not have to recreate the
          environment to add one. */}
      <SettingsSection
        title="Domain"
        description="Argo CD, Grafana and Prometheus are published on it, e.g. argocd.example.com."
      >
        <SettingsRowGroup>
          <SettingsRow
            title="Domain (optional)"
            controlId={`${id}-domain`}
            description="Leave it empty and no host-based ingress is generated."
            control={
              <FieldControl id={`${id}-domain`} error={domainError}>
                <Input
                  id={`${id}-domain`}
                  className="font-mono"
                  placeholder="e.g. example.com"
                  autoComplete="off"
                  value={newEnv.domain || ""}
                  {...invalidProps(`${id}-domain`, domainError)}
                  onChange={(e) =>
                    setNewEnv({ ...newEnv, domain: e.target.value.trim() })
                  }
                />
              </FieldControl>
            }
          />
        </SettingsRowGroup>
      </SettingsSection>

      {newEnv.provider === "aws" && (
        <TerraformBackendSection
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          credentials={credentials}
          useExistingBucket={useExistingBucket}
          setUseExistingBucket={chooseExistingBucket}
          existingOnly={isEditMode && Boolean(savedBucket)}
          backendCreated={backendCreated}
          creatingBackend={creatingBackend}
          createdBucketName={createdBucketName}
          onCreateBackend={handleCreateBackend}
          bucketReadOnly={bucketReadOnly}
          onChangeBucket={changeBucket}
          onCancelChange={
            bucketBeforeChange === null ? undefined : cancelBucketChange
          }
          error={errorFor("bucketName")}
        />
      )}

      <GitRepositorySection
        newEnv={newEnv}
        setNewEnv={setNewEnv}
        sshKeys={sshKeys}
        urlError={errorFor("gitUrl")}
      />

      <OtherSpecificationsSection />
    </div>
  );
};

export default BasicConfigStep;
