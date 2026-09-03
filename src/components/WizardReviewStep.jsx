// src/components/WizardReviewStep.jsx
// Read-only summary shown as the final wizard step before creating the environment.
import { Pencil, Check, AlertTriangle } from "lucide-react";

const PROVIDER_LABEL = {
  aws: "Amazon Web Services",
  azure: "Microsoft Azure",
  gcp: "Google Cloud Platform",
  onpremise: "On-Premise",
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5">
    <span className="section-label">{label}</span>
    <span className="text-sm font-medium text-primary text-right">
      {value || "—"}
    </span>
  </div>
);

const Card = ({ title, onEdit, children }) => (
  <div className="rounded-2xl border border-border bg-surface p-6">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-extrabold text-primary">{title}</h3>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      )}
    </div>
    {children}
  </div>
);

const WarningCallout = ({ children }) => (
  <div className="rounded-xl border border-warning/30 bg-warning-muted p-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
      <p className="text-sm text-warning font-medium">{children}</p>
    </div>
  </div>
);

const asText = (v, key) =>
  v && typeof v === "object" ? v[key] || "configured" : v || null;

const WizardReviewStep = ({ newEnv, onEditStep }) => {
  const services = Object.entries(newEnv.services || {})
    .filter(([, c]) => c?.enabled)
    .map(([k]) => k);
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
  const gitUrlSet = Boolean(newEnv.gitRepository?.url?.trim());
  const sshKeySet = Boolean(
    newEnv.gitRepository?.sshKey?.trim() ||
    newEnv.gitRepository?.sshKeyConfigured,
  );
  const terraformBackendEnabled = Boolean(
    newEnv.terraformBackend?.enabled ||
    newEnv.terraformBackend?.bucketName?.trim(),
  );
  const bucketNameSet = Boolean(newEnv.terraformBackend?.bucketName?.trim());

  const warnings = [
    needsGitRepo &&
      !gitUrlSet &&
      "Git repository URL is required when using Kubernetes/Helm charts",
    gitUrlSet &&
      !sshKeySet &&
      "An SSH key is required when a Git repository URL is set",
    terraformBackendEnabled &&
      !bucketNameSet &&
      "S3 bucket name is required when Terraform backend is enabled",
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-primary">
          Review &amp; create
        </h2>
        <p className="text-secondary mt-1">
          Confirm your configuration before creating the environment.
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning, index) => (
            <WarningCallout key={index}>{warning}</WarningCallout>
          ))}
        </div>
      )}

      {/* The Edit affordance stays in edit mode. Name and global prefix are
          still immutable (they name live Terraform resources) and the step
          renders them locked, but the domain is editable on purpose — hiding
          the whole step would put it out of reach. */}
      <Card title="Basic configuration" onEdit={() => onEditStep?.("basic")}>
        <Row label="Name" value={newEnv.name} />
        <Row label="Global prefix" value={newEnv.globalPrefix} />
        <Row
          label="Provider"
          value={PROVIDER_LABEL[newEnv.provider] || newEnv.provider}
        />
        <Row label="Region" value={newEnv.region || newEnv.location} />
        <Row label="Domain" value={newEnv.domain} />
      </Card>

      <Card
        title={`Services (${services.length})`}
        onEdit={() => onEditStep?.("services")}
      >
        {services.length ? (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-secondary"
              >
                <Check className="w-3 h-3 text-success" />
                {s.toUpperCase()}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-tertiary">No services selected.</p>
        )}
      </Card>

      {charts.length > 0 && (
        <Card
          title={`Helm charts (${charts.length})`}
          onEdit={() => onEditStep?.("helm")}
        >
          <div className="flex flex-wrap gap-2">
            {charts.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-secondary"
              >
                {c}
              </span>
            ))}
          </div>
        </Card>
      )}

      {(newEnv.terraformBackend || newEnv.gitRepository) && (
        <Card title="Infrastructure">
          {newEnv.terraformBackend && (
            <Row
              label="Terraform backend"
              value={asText(newEnv.terraformBackend, "bucket")}
            />
          )}
          {newEnv.gitRepository && (
            <Row
              label="Git repository"
              value={asText(newEnv.gitRepository, "url")}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default WizardReviewStep;
