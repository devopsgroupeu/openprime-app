import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import {
  getProviderConfig,
  getProviderRegions,
} from "../../config/providersConfig";
import { modifiedAt, prefixOf, regionOf } from "../../utils/environmentStats";
import { DetailList, DetailRow, Mono, NotConfigured } from "./DetailList";
import ExternalResources from "./ExternalResources";
import { CopyButton } from "@/components/shared/copy-button";
import { RelativeTime } from "@/components/shared/format";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const regionName = (environment) =>
  getProviderRegions(environment.provider)?.find(
    (r) => r.value === regionOf(environment),
  )?.label;

// The downloadable description of the environment (services, settings and
// metadata; no credentials or deploy key).
const generateConfiguration = (environment) => {
  const config = {
    id: environment.id,
    name: environment.name,
    globalPrefix: environment.global_prefix || environment.globalPrefix || "",
    provider: environment.provider,
    region: environment.region,
    location: environment.location || environment.region,
    // `status` deliberately omitted: nothing transitions it after creation, so
    // it is always "pending" and exporting it implies a live state we do not
    // track (OP-187).
    backend: environment.terraform_backend?.enabled || false,
    services: environment.services || {},
    createdAt:
      environment.createdAt ||
      environment.created_at ||
      new Date().toISOString(),
    updatedAt:
      environment.updatedAt ||
      environment.updated_at ||
      new Date().toISOString(),
  };

  if (environment.cloudCredential) {
    config.cloudCredential = {
      name: environment.cloudCredential.name,
      identifier: environment.cloudCredential.identifier,
      provider: environment.cloudCredential.provider,
    };
  }

  if (environment.terraform_backend) {
    config.terraformBackend = environment.terraform_backend;
  }

  if (environment.git_repository) {
    // Deliberately field-by-field, not a spread: this file is downloaded and
    // (per the copy below) version-controlled, so it must never gain a secret
    // by inheriting one that is added to git_repository later.
    config.gitRepository = {
      url: environment.git_repository.url || "",
      branch: environment.git_repository.branch || "HEAD",
    };
    // Add argocd object for Injecto compatibility
    config.argocd = {
      git_repo_url: environment.git_repository.url || "",
      targetRevision: environment.git_repository.branch || "HEAD",
      git_target_revision: environment.git_repository.branch || "HEAD",
    };
  }

  return config;
};

const formatAsYAML = (obj, indent = 0) => {
  const spaces = "  ".repeat(indent);
  let yaml = "";

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n${formatAsYAML(value, indent + 1)}`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach((item) => {
        if (typeof item === "object") {
          yaml += `${spaces}  -\n${formatAsYAML(item, indent + 2)}`;
        } else {
          yaml += `${spaces}  - ${item}\n`;
        }
      });
    } else if (typeof value === "string") {
      yaml += `${spaces}${key}: "${value}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  });

  return yaml;
};

const FORMATS = { json: "JSON", yaml: "YAML" };

const formatted = (environment, format) => {
  const config = generateConfiguration(environment);
  return format === "yaml"
    ? formatAsYAML(config)
    : JSON.stringify(config, null, 2);
};

function ConfigurationFile({ environment }) {
  const { success } = useToast();
  const [format, setFormat] = useState("json");

  const download = () => {
    const fileName = `${environment.name}-config.${format}`;
    const mimeType = format === "yaml" ? "text/yaml" : "application/json";
    const blob = new Blob([formatted(environment, format)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    success(`Configuration downloaded as ${fileName}`);
  };

  return (
    <SettingsSection
      title="Configuration file"
      description="Services, settings and metadata. Credentials and the git deploy key are not included."
    >
      <Tabs value={format} onValueChange={setFormat}>
        <div className="flex items-center justify-between gap-3">
          <TabsList aria-label="Format">
            {Object.entries(FORMATS).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="secondary" size="sm" onClick={download}>
            <Download aria-hidden />
            Download
          </Button>
        </div>
        {Object.entries(FORMATS).map(([value, label]) => {
          const content = formatted(environment, value);
          return (
            <TabsContent key={value} value={value} className="relative">
              {/* Focusable so keyboard users can scroll it. */}
              <pre
                tabIndex={0}
                aria-label={`${label} configuration`}
                className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 pr-12 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <code>{content}</code>
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton
                  text={content}
                  label={`Copy ${label} configuration`}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </SettingsSection>
  );
}

/** Configuration tab: every basic field, git and state, the file, danger zone. */
const EnvironmentConfiguration = ({
  environment,
  onEnvironmentUpdate,
  editHref,
  onDelete,
}) => {
  const prefix = prefixOf(environment);
  const region = regionOf(environment);
  const credential = environment.cloudCredential;
  const created = environment.created_at || environment.createdAt;
  const modified = modifiedAt(environment);
  const copy = (text, label) => <CopyButton text={text} label={label} />;

  return (
    <>
      <SettingsSection title="Basics">
        <DetailList>
          <DetailRow label="Name" actions={copy(environment.name, "Copy name")}>
            <p className="truncate">{environment.name}</p>
          </DetailRow>
          <DetailRow
            label="Environment ID"
            actions={copy(environment.id, "Copy environment ID")}
          >
            <Mono>{environment.id}</Mono>
          </DetailRow>
          {prefix ? (
            <DetailRow
              label="Global prefix"
              actions={copy(prefix, "Copy prefix")}
            >
              <Mono>{prefix}</Mono>
            </DetailRow>
          ) : null}
          <DetailRow label="Provider">
            {getProviderConfig(environment.provider)?.name ||
              environment.provider}
          </DetailRow>
          {region ? (
            <DetailRow label="Region" actions={copy(region, "Copy region")}>
              <p className="truncate">
                <span className="font-mono text-xs">{region}</span>
                {regionName(environment) ? (
                  <span className="ml-2 text-muted-foreground">
                    {regionName(environment)}
                  </span>
                ) : null}
              </p>
            </DetailRow>
          ) : null}
          <DetailRow
            label="Domain"
            actions={
              environment.domain
                ? copy(environment.domain, "Copy domain")
                : null
            }
          >
            {environment.domain ? (
              <Mono>{environment.domain}</Mono>
            ) : (
              <NotConfigured editHref={editHref} />
            )}
          </DetailRow>
          <DetailRow
            label="Credentials"
            actions={
              credential
                ? copy(credential.identifier, "Copy AWS account ID")
                : null
            }
          >
            {credential ? (
              <p className="truncate">
                {credential.name}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {credential.identifier}
                </span>
              </p>
            ) : (
              <NotConfigured editHref={editHref} />
            )}
          </DetailRow>
          {created ? (
            <DetailRow label="Created">
              <RelativeTime iso={created} />
            </DetailRow>
          ) : null}
          {modified ? (
            <DetailRow label="Modified">
              <RelativeTime iso={modified} />
            </DetailRow>
          ) : null}
        </DetailList>
      </SettingsSection>

      <ExternalResources
        environment={environment}
        onEnvironmentUpdate={onEnvironmentUpdate}
        editHref={editHref}
      />

      <ConfigurationFile environment={environment} />

      <SettingsSection title="Danger zone">
        <SettingsRowGroup>
          <SettingsRow
            title="Delete environment"
            description="Removes this environment from OpenPrime. AWS resources, the Terraform state bucket and code already pushed to git are not touched."
            control={
              // Tinted destructive (DESIGN 3.2); the label stays foreground
              // on the tint for AA, the icon carries the red.
              <Button
                variant="ghost"
                size="lg"
                onClick={onDelete}
                className="bg-destructive/10 text-foreground hover:bg-destructive/15 hover:text-foreground focus-visible:ring-destructive dark:bg-destructive/15 dark:hover:bg-destructive/25 [&_svg]:text-destructive"
              >
                <Trash2 aria-hidden />
                Delete environment
              </Button>
            }
          />
        </SettingsRowGroup>
      </SettingsSection>
    </>
  );
};

export default EnvironmentConfiguration;
