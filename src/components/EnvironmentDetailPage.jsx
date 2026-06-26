import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Server,
  Package,
  Database,
  GitBranch,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import EnvironmentHeader from "./environment-detail/EnvironmentHeader";
import ServicesList from "./environment-detail/ServicesList";
import HelmChartsList from "./environment-detail/HelmChartsList";
import EnvironmentConfiguration from "./environment-detail/EnvironmentConfiguration";
import { getProviderConfig } from "../config/providersConfig";

// InfraFlow-style metric card: uppercase label, large value, optional progress bar.
const MetricCard = ({ label, value, sub, progress }) => (
  <div className="rounded-2xl border border-border bg-surface p-6">
    <p className="section-label mb-2">{label}</p>
    <p className="text-3xl font-extrabold text-primary">{value}</p>
    {progress != null && (
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="progress-glow h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    )}
    {sub && <p className="mt-2 text-xs text-tertiary">{sub}</p>}
  </div>
);

const ConfigRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="section-label">{label}</span>
    <span
      className={`text-sm font-medium text-primary text-right truncate ${mono ? "font-mono" : ""}`}
    >
      {value || "—"}
    </span>
  </div>
);

const EnvironmentDetailPage = ({ onDelete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    const fetchEnvironment = async () => {
      if (id) {
        try {
          setLoading(true);
          const envData = await authService.get(`/environments/${id}`);
          setEnvironment(envData);
        } catch (err) {
          console.error("Failed to fetch environment:", err);
          setEnvironment(null);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEnvironment();
  }, [id]);

  if (loading) {
    return (
      <div className="transition-colors duration-200 bg-transparent text-primary">
        <div className="px-8 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading environment...</p>
        </div>
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="transition-colors duration-200 bg-transparent text-primary">
        <div className="px-8 py-16 text-center">
          <p>Environment not found</p>
        </div>
      </div>
    );
  }

  const providerConfig = getProviderConfig(environment.provider);

  const handleEdit = () => navigate(`/environments/${environment.id}/edit`);
  const handleDelete = () => setShowDeleteModal(true);
  const confirmDelete = () => {
    onDelete(environment.id);
    setShowDeleteModal(false);
    navigate("/environments");
  };

  const generateInfrastructure = async () => {
    try {
      setIsGenerating(true);
      const response = await authService.post(
        `/environments/${environment.id}/generate`,
        {},
        { responseType: "blob", timeout: 120000 },
      );
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${environment.name}-infrastructure.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      success(
        "Infrastructure repository generated and downloaded successfully",
      );
    } catch (err) {
      console.error("Error generating infrastructure:", err);
      error(
        err.response?.data?.error ||
          "Failed to generate infrastructure. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const pushInfrastructure = async () => {
    try {
      setIsPushing(true);
      const response = await authService.post(
        `/environments/${environment.id}/push`,
        {},
        { timeout: 120000 },
      );
      success(response?.message || "Infrastructure pushed to Git successfully");
    } catch (err) {
      console.error("Error pushing to Git:", err);
      error(err.message || "Failed to push to Git. Please try again.");
    } finally {
      setIsPushing(false);
    }
  };

  const services = environment.services || {};
  const enabledCount = Object.values(services).filter((s) => s?.enabled).length;
  const totalCount = Object.keys(services).length;
  const helmCount = Object.values(services.eks?.helmCharts || {}).filter(
    (c) => c?.enabled,
  ).length;

  const gitRepo = environment.git_repository || environment.gitRepository;
  const tfBackend =
    environment.terraform_backend || environment.terraformBackend;
  const gitEnabled = gitRepo?.enabled;
  const tfEnabled = tfBackend?.enabled;
  const prefix = environment.globalPrefix || environment.global_prefix;

  const cleanGitUrl = (u) =>
    (u || "")
      .replace("git@github.com:", "")
      .replace("git@gitlab.com:", "")
      .replace(/\.git$/, "");

  return (
    <div className="transition-colors duration-200 bg-transparent">
      <EnvironmentHeader
        environment={environment}
        providerConfig={providerConfig}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerate={generateInfrastructure}
        onPush={pushInfrastructure}
        isGenerating={isGenerating}
        isPushing={isPushing}
        canPush={gitEnabled}
      />

      <div className="px-8 py-8 space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Active Services"
            value={`${enabledCount}/${totalCount}`}
            progress={totalCount ? (enabledCount / totalCount) * 100 : 0}
            sub="Cloud services enabled"
          />
          <MetricCard
            label="Helm Charts"
            value={helmCount}
            sub="Kubernetes deployments"
          />
          <MetricCard
            label="Total Resources"
            value={enabledCount + helmCount}
            sub="Services + charts"
          />
          <MetricCard
            label="Region"
            value={environment.region || "—"}
            sub={providerConfig?.name || environment.provider}
          />
        </div>

        {/* Two-column: services/helm (left) + config/actions (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-6">
                <Server className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-primary">
                  Infrastructure Services
                </h2>
              </div>
              <ServicesList environment={environment} />
            </section>

            {environment.services?.eks?.enabled && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-primary">
                    Helm Applications
                  </h2>
                </div>
                <HelmChartsList environment={environment} />
              </section>
            )}
          </div>

          <div className="space-y-8">
            {/* Config details */}
            <section className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary">
                  Config Details
                </h2>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 text-xs font-bold text-secondary transition-colors hover:text-primary"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
              <p className="section-label mb-1">Variables</p>
              <div className="divide-y divide-border">
                <ConfigRow
                  label="Provider"
                  value={providerConfig?.name || environment.provider}
                />
                <ConfigRow label="Region" value={environment.region} />
                <ConfigRow label="Global Prefix" value={prefix} mono />
                <ConfigRow
                  label="Terraform Backend"
                  value={
                    tfEnabled
                      ? tfBackend.lockingMechanism
                        ? `S3 + ${tfBackend.lockingMechanism}`
                        : "S3"
                      : "Not configured"
                  }
                />
                <ConfigRow
                  label="Git Repository"
                  value={
                    gitEnabled ? cleanGitUrl(gitRepo.url) : "Not configured"
                  }
                  mono={gitEnabled}
                />
              </div>
            </section>

            {/* External resources */}
            {(gitEnabled || tfEnabled) && (
              <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-bold text-primary mb-4">
                  External Resources
                </h2>
                <div className="space-y-2">
                  {gitEnabled && gitRepo.url && (
                    <a
                      href={gitRepo.url
                        .replace("git@github.com:", "https://github.com/")
                        .replace("git@gitlab.com:", "https://gitlab.com/")
                        .replace(/\.git$/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-lg flex items-center justify-between transition-colors bg-background border border-border hover:bg-surface-elevated text-secondary"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <GitBranch className="w-4 h-4 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium block text-primary">
                            Git Repository
                          </span>
                          <span className="text-xs truncate block text-tertiary">
                            {cleanGitUrl(gitRepo.url)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    </a>
                  )}
                  {tfEnabled && tfBackend.bucketName && (
                    <a
                      href={`https://${environment.region}.console.aws.amazon.com/s3/buckets/${tfBackend.bucketName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-lg flex items-center justify-between transition-colors bg-background border border-border hover:bg-surface-elevated text-secondary"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Database className="w-4 h-4 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium block text-primary">
                            S3 Backend
                          </span>
                          <span className="text-xs truncate block text-tertiary">
                            {tfBackend.bucketName}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Generated configuration (Terraform backend + IaC code export) */}
        <EnvironmentConfiguration
          environment={environment}
          onEnvironmentUpdate={setEnvironment}
        />
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default EnvironmentDetailPage;
