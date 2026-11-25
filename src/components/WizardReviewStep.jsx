// src/components/WizardReviewStep.jsx
// Read-only summary shown as the final wizard step: problems first, then one
// section per step with an Edit that jumps back to it.
import { Pencil } from "lucide-react";
import { PROVIDERS } from "../config/environmentsConfig";
import { getServiceConfig } from "../config/servicesConfig";
import { getHelmChartConfig } from "../config/helmChartsConfig";
import { chartLogo, gitLogo } from "../config/logos";
import ServiceIcon from "./icons/ServiceIcon";
import { summaryOf } from "./environment-detail/ServicesList";
import { DetailList, DetailRow } from "./environment-detail/DetailList";
import { Callout } from "@/components/shared/callout";
import { LogoTile } from "@/components/shared/logo-tile";
import { SettingsSection } from "@/components/shared/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, TOUCH_HIT } from "@/lib/utils";

const ROWS =
  "divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset";

/** A value, mono for machine values; "-" in muted text when empty. */
const Value = ({ children, mono = false }) =>
  children ? (
    <span className={mono ? "font-mono text-xs break-all" : undefined}>
      {children}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  );

// Below md the hit area grows invisibly, so the label stays on the heading line.
const EditButton = ({ label, onClick }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={`Edit ${label.toLowerCase()}`}
    className={cn("max-md:min-h-7", TOUCH_HIT)}
  >
    <Pencil aria-hidden />
    Edit
  </Button>
);

/** A list of problems in a callout, with a button to the `step` that fixes them. */
// A summary that is there whenever Review opens: read in place, not announced.
const Problems = ({ variant, title, items, step, onGo }) => (
  <Callout
    variant={variant}
    announce={false}
    title={title}
    action={
      <Button variant="secondary" size="xs" onClick={onGo}>
        Go to {step}
      </Button>
    }
  >
    <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </Callout>
);

// `problems`: Basics errors (Create sends the user back to them);
// `serviceProblems`: errors of enabled services, shown only. Incomplete
// delivery does not stop Create either, so Review says what stays unavailable.
const WizardReviewStep = ({
  newEnv,
  onEditStep,
  problems = [],
  serviceProblems = [],
}) => {
  const k8s = newEnv.services?.eks || newEnv.services?.aks;
  const charts = Object.entries(k8s?.helmCharts || {})
    .filter(([, c]) => c?.enabled)
    .map(([k]) => k);

  const hasKubernetesService =
    newEnv.services?.eks?.enabled ||
    newEnv.services?.aks?.enabled ||
    newEnv.services?.gke?.enabled ||
    newEnv.services?.kubernetes?.enabled;
  const hasHelmCharts = charts.length > 0;
  const needsGitRepo = hasKubernetesService || hasHelmCharts;
  const gitOn = Boolean(newEnv.gitRepository?.enabled);
  const gitUrlSet = Boolean(newEnv.gitRepository?.url?.trim());
  const sshKeySet = Boolean(
    newEnv.gitRepository?.sshKey?.trim() ||
    newEnv.gitRepository?.sshKeyConfigured,
  );
  const terraformBackendEnabled = Boolean(newEnv.terraformBackend?.enabled);

  // A switched-on section with an empty required field is a Basics problem.
  // Switched off, git keeps its fields but is not used.
  const warnings = [
    needsGitRepo &&
      !gitOn &&
      "Push to git and Helm charts stay unavailable until you switch git on and add a repository.",
    gitOn &&
      gitUrlSet &&
      !sshKeySet &&
      "Push to git stays unavailable until you add a deploy key.",
  ].filter(Boolean);

  const services = Object.entries(newEnv.services || {}).filter(
    ([, config]) => config?.enabled,
  );
  // Only the charts the Helm step shows: on the enabled cluster, still known,
  // not always installed (Argo CD, Karpenter).
  const shownCharts = hasKubernetesService
    ? charts.filter((key) => {
        const chart = getHelmChartConfig(key);
        return chart && !chart.implicit;
      })
    : [];
  const provider = PROVIDERS[newEnv.provider];
  const regionCode = newEnv.region || newEnv.location;
  const regionLabel = provider?.regions.find(
    (r) => r.value === regionCode,
  )?.label;
  const git = newEnv.gitRepository;

  return (
    <div className="flex flex-col gap-8">
      {problems.length > 0 ||
      serviceProblems.length > 0 ||
      warnings.length > 0 ? (
        <div className="flex flex-col gap-3">
          {problems.length > 0 ? (
            <Problems
              variant="error"
              title="Basics needs attention."
              items={problems.map((p) => p.message)}
              step="Basics"
              onGo={() => onEditStep?.("basic")}
            />
          ) : null}
          {serviceProblems.length > 0 ? (
            <Problems
              variant="error"
              title="Services need attention."
              items={serviceProblems.map((p) => p.message)}
              step="Services"
              onGo={() => onEditStep?.("services")}
            />
          ) : null}
          {warnings.length > 0 ? (
            <Problems
              variant="warning"
              title="Delivery is incomplete."
              items={warnings}
              step="Basics"
              onGo={() => onEditStep?.("basic")}
            />
          ) : null}
        </div>
      ) : null}

      {/* The Edit affordance stays in edit mode. Name and resource prefix are
          still immutable (they name live Terraform resources) and the step
          renders them locked, but the domain is editable on purpose: hiding
          the whole step would put it out of reach. */}
      <SettingsSection
        title="Basics"
        action={
          <EditButton label="Basics" onClick={() => onEditStep?.("basic")} />
        }
      >
        <DetailList>
          <DetailRow label="Name">
            <Value mono>{newEnv.name}</Value>
          </DetailRow>
          <DetailRow label="Resource prefix">
            <Value mono>{newEnv.globalPrefix}</Value>
          </DetailRow>
          <DetailRow label="Provider">
            <Value>{provider?.name || newEnv.provider}</Value>
          </DetailRow>
          <DetailRow label="Region">
            {regionLabel ? (
              <span className="flex flex-wrap items-baseline gap-x-2">
                {regionLabel}
                <span className="font-mono text-xs text-muted-foreground">
                  {regionCode}
                </span>
              </span>
            ) : (
              <Value mono>{regionCode}</Value>
            )}
          </DetailRow>
          <DetailRow label="Domain">
            <Value mono>{newEnv.domain}</Value>
          </DetailRow>
        </DetailList>
      </SettingsSection>

      <SettingsSection
        title={`Services (${services.length})`}
        action={
          <EditButton
            label="Services"
            onClick={() => onEditStep?.("services")}
          />
        }
      >
        {services.length > 0 ? (
          <ul className={ROWS}>
            {services.map(([name, config]) => {
              const definition = getServiceConfig(name);
              const summary = summaryOf(name, config, definition);
              return (
                <li key={name} className="flex items-center gap-3 px-3.5 py-3">
                  <ServiceIcon service={name} className="size-8" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {definition?.displayName || name.toUpperCase()}
                    </span>
                    {summary ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {summary}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No services enabled.</p>
        )}
      </SettingsSection>

      {hasKubernetesService ? (
        <SettingsSection
          title={`Helm charts (${shownCharts.length})`}
          action={
            <EditButton
              label="Helm charts"
              onClick={() => onEditStep?.("helm")}
            />
          }
        >
          {shownCharts.length > 0 ? (
            <ul className={ROWS}>
              {shownCharts.map((key) => {
                const chart = getHelmChartConfig(key);
                return (
                  <li key={key} className="flex items-center gap-3 px-3.5 py-3">
                    <LogoTile {...chartLogo(key)} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {chart.displayName}
                    </span>
                    <Badge variant="tag" className="font-mono">
                      {chart.version}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No charts selected. Argo CD and Karpenter are always installed.
            </p>
          )}
        </SettingsSection>
      ) : null}

      <SettingsSection
        title="Delivery"
        action={
          <EditButton label="Delivery" onClick={() => onEditStep?.("basic")} />
        }
      >
        <DetailList>
          <DetailRow label="Git repository">
            {gitUrlSet ? (
              <span className="flex items-center gap-2">
                <LogoTile {...gitLogo(git.url)} size="sm" />
                <Value mono>{git.url.trim()}</Value>
              </span>
            ) : (
              <Value />
            )}
          </DetailRow>
          {gitUrlSet ? (
            <>
              <DetailRow label="Branch or revision">
                <Value mono>{git.branch}</Value>
              </DetailRow>
              <DetailRow label="Deploy key">
                <Value>{sshKeySet ? "Set" : ""}</Value>
              </DetailRow>
            </>
          ) : null}
          <DetailRow label="State backend bucket">
            <Value mono>
              {terraformBackendEnabled
                ? newEnv.terraformBackend.bucketName
                : ""}
            </Value>
          </DetailRow>
        </DetailList>
      </SettingsSection>
    </div>
  );
};

export default WizardReviewStep;
