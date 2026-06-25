import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Activity,
  Settings,
  BarChart3,
  Database,
  Container,
  Package,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import Navigation from "./Navigation";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import EnvironmentWizard from "./modals/EnvironmentWizard";
import HelmValuesModal from "./modals/HelmValuesModal";
import EnvironmentHeader from "./environment-detail/EnvironmentHeader";
import ServicesList from "./environment-detail/ServicesList";
import ServicesOverview from "./environment-detail/ServicesOverview";
import HelmChartsList from "./environment-detail/HelmChartsList";
import EnvironmentConfiguration from "./environment-detail/EnvironmentConfiguration";
import { getProviderConfig } from "../config/providersConfig";

const EnvironmentDetailPage = ({ onEdit, onDelete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { success, error } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showValuesEditor, setShowValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState("");
  const [editEnv, setEditEnv] = useState(null);
  const [expandedServices, setExpandedServices] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    const fetchEnvironment = async () => {
      if (id) {
        try {
          setLoading(true);
          const envData = await authService.get(`/environments/${id}`);
          setEnvironment(envData);
        } catch (error) {
          console.error("Failed to fetch environment:", error);
          setEnvironment(null);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEnvironment();
  }, [id]);

  useEffect(() => {
    const handleRefresh = async () => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
    };

    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-background text-primary">
        <Navigation />
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading environment...</p>
        </div>
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="min-h-screen transition-colors duration-200 bg-background text-primary">
        <Navigation />
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <p>Environment not found</p>
        </div>
      </div>
    );
  }

  const providerConfig = getProviderConfig(environment.provider);

  const handleEdit = () => {
    setEditEnv({ ...environment });
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(environment.id);
    setShowDeleteModal(false);
    navigate("/environments");
  };

  const handleUpdateEnvironment = async () => {
    if (!editEnv.name) {
      error("Please enter an environment name", {
        title: "Validation Error",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const updated = await onEdit(editEnv);
      setEnvironment(updated);
      success(`Environment "${editEnv.name}" updated successfully`, {
        title: "Environment Updated",
        duration: 4000,
      });

      setShowEditModal(false);
      setEditEnv(null);
      setExpandedServices({});
    } catch (err) {
      error(`Failed to update environment: ${err.message}`, {
        title: "Error",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHelmValues = () => {
    const kubernetesService = editEnv.provider === "azure" ? "aks" : "eks";
    setEditEnv({
      ...editEnv,
      services: {
        ...editEnv.services,
        [kubernetesService]: {
          ...editEnv.services[kubernetesService],
          helmCharts: {
            ...editEnv.services[kubernetesService].helmCharts,
            [showValuesEditor]: {
              ...editEnv.services[kubernetesService].helmCharts[showValuesEditor],
              customValues: true,
            },
          },
        },
      },
    });
    setShowValuesEditor(null);
    setEditingHelmValues("");
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

      success("Infrastructure generated and downloaded successfully");
    } catch (err) {
      console.error("Error generating infrastructure:", err);
      error(err.response?.data?.error || "Failed to generate infrastructure. Please try again.");
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

  const getResourceStats = () => {
    const services = environment.services || {};
    const enabledCount = Object.values(services).filter((s) => s?.enabled).length;
    const totalCount = Object.keys(services).length;
    const helmCount = Object.values(services.eks?.helmCharts || {}).filter(
      (c) => c?.enabled,
    ).length;

    return { enabledCount, totalCount, helmCount };
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, color = "teal" }) => (
    <div
      className={`rounded-xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] ${
        isDark
          ? "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60"
          : "bg-white/60 border-gray-200/50 hover:bg-white/80"
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-${color}-500/10`}>
            <Icon className={`w-6 h-6 text-${color}-500`} />
          </div>
        </div>
        <div>
          <h3 className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
            {value}
          </h3>
          <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        activeTab === id
          ? isDark
            ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
            : "bg-teal-50 text-teal-600 border border-teal-200"
          : isDark
            ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            activeTab === id
              ? isDark
                ? "bg-teal-500/30 text-teal-300"
                : "bg-teal-100 text-teal-700"
              : isDark
                ? "bg-gray-700 text-gray-400"
                : "bg-gray-200 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  const { enabledCount, totalCount, helmCount } = getResourceStats();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          icon={Database}
          title="Active Services"
          value={`${enabledCount}/${totalCount}`}
          subtitle="Cloud services configured"
          color="teal"
        />
        <MetricCard
          icon={Container}
          title="Helm Charts"
          value={helmCount}
          subtitle="Kubernetes deployments"
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`lg:col-span-2 rounded-xl border backdrop-blur-sm ${
            isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Resource Overview
              </h3>
              <button
                onClick={() => {
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 1000);
                }}
                className={`p-2 rounded-lg transition-colors ${refreshing ? "animate-spin" : ""} ${
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
            <ServicesOverview environment={environment} />
          </div>
        </div>

        <div
          className={`rounded-xl border backdrop-blur-sm ${
            isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
          }`}
        >
          <div className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleEdit}
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isDark
                    ? "bg-teal-600/20 hover:bg-teal-600/30 text-teal-400"
                    : "bg-teal-50 hover:bg-teal-100 text-teal-600"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Configure Environment</span>
              </button>
              <button
                onClick={generateInfrastructure}
                disabled={isGenerating}
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isGenerating
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "bg-teal-600/20 hover:bg-teal-600/30 text-teal-400"
                      : "bg-teal-50 hover:bg-teal-100 text-teal-600"
                }`}
              >
                <Package className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "Generating..." : "Generate Infrastructure"}</span>
              </button>
              <button
                onClick={pushInfrastructure}
                disabled={isPushing || !environment.git_repository?.enabled}
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isPushing || !environment.git_repository?.enabled
                    ? "opacity-50 cursor-not-allowed"
                    : isDark
                      ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-600"
                }`}
              >
                <GitBranch className={`w-4 h-4 ${isPushing ? "animate-spin" : ""}`} />
                <span>{isPushing ? "Pushing..." : "Push to Git"}</span>
              </button>
            </div>

            {/* External Resources */}
            {(environment.git_repository?.enabled || environment.terraform_backend?.enabled) && (
              <div className="mt-6">
                <h4
                  className={`text-sm font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  External Resources
                </h4>
                <div className="space-y-2">
                  {environment.git_repository?.enabled && environment.git_repository?.url && (
                    <a
                      href={environment.git_repository.url
                        .replace("git@github.com:", "https://github.com/")
                        .replace("git@gitlab.com:", "https://gitlab.com/")
                        .replace(/\.git$/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                        isDark
                          ? "bg-gray-700/30 hover:bg-gray-700/50 text-gray-300"
                          : "bg-gray-100/50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <GitBranch className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium block">Git Repository</span>
                          <span
                            className={`text-xs truncate block ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            {environment.git_repository.url
                              .replace("git@github.com:", "")
                              .replace("git@gitlab.com:", "")
                              .replace(/\.git$/, "")}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    </a>
                  )}
                  {environment.terraform_backend?.enabled &&
                    environment.terraform_backend?.bucketName && (
                      <a
                        href={`https://${environment.region}.console.aws.amazon.com/s3/buckets/${environment.terraform_backend.bucketName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                          isDark
                            ? "bg-gray-700/30 hover:bg-gray-700/50 text-gray-300"
                            : "bg-gray-100/50 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <Database className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium block">S3 Backend</span>
                            <span
                              className={`text-xs truncate block ${isDark ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {environment.terraform_backend.bucketName}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      </a>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-200 bg-background">
      <Navigation />
      <EnvironmentHeader
        environment={environment}
        providerConfig={providerConfig}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={BarChart3} />
            <TabButton id="services" label="Services" icon={Database} count={enabledCount} />
            {environment.services?.eks?.enabled && (
              <TabButton id="helm" label="Helm Charts" icon={Container} count={helmCount} />
            )}
            <TabButton id="configuration" label="Configuration" icon={Settings} />
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "services" && (
            <div
              className={`rounded-xl border backdrop-blur-sm ${
                isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="p-6">
                <ServicesList environment={environment} />
              </div>
            </div>
          )}
          {activeTab === "helm" && environment.services?.eks?.enabled && (
            <div
              className={`rounded-xl border backdrop-blur-sm ${
                isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="p-6">
                <HelmChartsList environment={environment} />
              </div>
            </div>
          )}
          {activeTab === "configuration" && (
            <div
              className={`rounded-xl border backdrop-blur-sm ${
                isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="p-6">
                <EnvironmentConfiguration
                  environment={environment}
                  onEnvironmentUpdate={setEnvironment}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}

      {showEditModal && editEnv && (
        <EnvironmentWizard
          newEnv={editEnv}
          setNewEnv={setEditEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onClose={() => {
            setShowEditModal(false);
            setExpandedServices({});
            setEditEnv(null);
          }}
          onCreate={handleUpdateEnvironment}
          isEditMode={true}
          isLoading={isLoading}
          onEditHelmValues={(chart, values) => {
            setShowValuesEditor(chart);
            setEditingHelmValues(values);
          }}
        />
      )}

      {showValuesEditor && (
        <HelmValuesModal
          chartName={showValuesEditor}
          values={editingHelmValues}
          onChange={setEditingHelmValues}
          onClose={() => setShowValuesEditor(null)}
          onSave={handleSaveHelmValues}
        />
      )}
    </div>
  );
};

export default EnvironmentDetailPage;
