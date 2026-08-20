import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Server,
  Package,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import EnvironmentHeader from "./environment-detail/EnvironmentHeader";
import ServicesList from "./environment-detail/ServicesList";
import HelmChartsList from "./environment-detail/HelmChartsList";
import ExternalResources from "./environment-detail/ExternalResources";
import EnvironmentConfiguration from "./environment-detail/EnvironmentConfiguration";
import {
  getProviderConfig,
  getProviderRegions,
} from "../config/providersConfig";

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
  const [expandedServices, setExpandedServices] = useState({});
  const { success, error } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
  // Region location for the metric card sub (e.g. "Ireland" from "EU (Ireland)").
  const regionLabel = getProviderRegions(environment.provider)?.find(
    (r) => r.value === environment.region,
  )?.label;
  const regionLocation = regionLabel
    ? regionLabel.match(/\(([^)]+)\)/)?.[1] || regionLabel
    : providerConfig?.name || environment.provider;

  const handleEdit = () => navigate(`/environments/${environment.id}/edit`);
  const handleDelete = () => setShowDeleteModal(true);
  const confirmDelete = () => {
    onDelete(environment.id);
    setShowDeleteModal(false);
    navigate("/environments");
  };

  // Async job model: POST returns 202 + jobId, then we poll GET /api/jobs/:jobId
  // until the job reaches a terminal state (succeeded/failed/cancelled).
  const pollJob = async (jobId) => {
    const pollIntervalMs = 2000;
    const maxPolls = 150; // ~5 minutes — jobs run in the background worker
    for (let i = 0; i < maxPolls; i++) {
      if (!mountedRef.current) throw new Error("Operation cancelled");
      const job = await authService.get(`/jobs/${jobId}`);
      if (job.status === "succeeded") return job;
      if (job.status === "failed") throw new Error(job.error || "Job failed");
      if (job.status === "cancelled") throw new Error("Job was cancelled");
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error("Operation timed out. Check the job status later.");
  };

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateInfrastructure = async () => {
    try {
      setIsGenerating(true);
      const { jobId } = await authService.post(
        `/environments/${environment.id}/generate`,
        {},
      );
      const job = await pollJob(jobId);
      if (!job.result?.downloadUrl) {
        throw new Error("Generated artifact is not available");
      }
      const blob = await authService.getBlob(job.result.downloadUrl);
      triggerDownload(blob, `${environment.name}-infrastructure.zip`);
      success("Infrastructure repository generated and downloaded successfully");
    } catch (err) {
      console.error("Error generating infrastructure:", err);
      error(
        err.response?.data?.error ||
          err.message ||
          "Failed to generate infrastructure. Please try again.",
      );
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  };

  const pushInfrastructure = async () => {
    try {
      setIsPushing(true);
      const { jobId } = await authService.post(
        `/environments/${environment.id}/push`,
        {},
      );
      const job = await pollJob(jobId);
      success(job.result?.message || "Infrastructure pushed to Git successfully");
    } catch (err) {
      console.error("Error pushing to Git:", err);
      error(err.message || "Failed to push to Git. Please try again.");
    } finally {
      if (mountedRef.current) setIsPushing(false);
    }
  };

  const services = environment.services || {};
  const enabledCount = Object.values(services).filter((s) => s?.enabled).length;
  const helmCount = Object.values(services.eks?.helmCharts || {}).filter(
    (c) => c?.enabled,
  ).length;

  const gitRepo = environment.git_repository || environment.gitRepository;
  const gitEnabled = gitRepo?.enabled;
  const prefix = environment.globalPrefix || environment.global_prefix;

  // Services expansion is owned here so the "Expand/Collapse all" toggle can
  // live on the section heading row (like Config Details · Edit).
  const expandableServices = Object.entries(services).filter(
    ([, config]) =>
      config?.enabled &&
      Object.keys(config).some((k) => k !== "enabled" && k !== "helmCharts"),
  );
  const allServicesExpanded =
    expandableServices.length > 0 &&
    expandableServices.every(([name]) => expandedServices[name]);
  const toggleService = (name) =>
    setExpandedServices((prev) => ({ ...prev, [name]: !prev[name] }));
  const toggleAllServices = () => {
    if (allServicesExpanded) {
      setExpandedServices({});
    } else {
      const next = {};
      expandableServices.forEach(([name]) => {
        next[name] = true;
      });
      setExpandedServices(next);
    }
  };

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
            value={enabledCount}
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
            sub={regionLocation}
          />
        </div>

        {/* Two-column: services/helm (left) + config/actions (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-accent" />
                  <h2 className="text-2xl font-extrabold text-primary">
                    Infrastructure Services
                  </h2>
                </div>
                {expandableServices.length > 0 && (
                  <button
                    onClick={toggleAllServices}
                    className="flex items-center gap-1 text-xs font-bold text-secondary transition-colors hover:text-primary"
                  >
                    {allServicesExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Collapse all
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Expand all
                      </>
                    )}
                  </button>
                )}
              </div>
              <ServicesList
                environment={environment}
                expandedServices={expandedServices}
                onToggleService={toggleService}
              />
            </section>

            {environment.services?.eks?.enabled && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-accent" />
                  <h2 className="text-2xl font-extrabold text-primary">
                    Helm Applications
                  </h2>
                </div>
                <HelmChartsList environment={environment} />
              </section>
            )}

            <EnvironmentConfiguration environment={environment} />
          </div>

          <div className="space-y-8">
            {/* Config details */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-extrabold text-primary">
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
              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="divide-y divide-border">
                  <ConfigRow
                    label="Provider"
                    value={providerConfig?.name || environment.provider}
                  />
                  <ConfigRow label="Region" value={environment.region} />
                  <ConfigRow label="Global Prefix" value={prefix} mono />
                  <div className="flex items-start justify-between gap-4 py-2.5">
                    <span className="section-label">Credentials</span>
                    {environment.cloudCredential ? (
                      <div className="min-w-0 text-right">
                        <p className="text-sm font-medium text-primary truncate">
                          {environment.cloudCredential.name}
                        </p>
                        <p className="text-xs font-mono text-tertiary truncate">
                          Account {environment.cloudCredential.identifier}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-primary text-right">
                        Manual configuration
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <ExternalResources
              environment={environment}
              onEnvironmentUpdate={setEnvironment}
            />
          </div>
        </div>
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
