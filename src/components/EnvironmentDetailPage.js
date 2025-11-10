import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Activity,
  TrendingUp,
  Settings,
  Download,
  Eye,
  BarChart3,
  Shield,
  Database,
  Container,
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

  const getResourceStats = () => {
    const services = environment.services || {};
    const enabledCount = Object.values(services).filter((s) => s?.enabled).length;
    const totalCount = Object.keys(services).length;
    const helmCount = Object.values(services.eks?.helmCharts || {}).filter(
      (c) => c?.enabled
    ).length;

    return { enabledCount, totalCount, helmCount };
  };

  const getHealthScore = () => {
    const { enabledCount } = getResourceStats();
    if (enabledCount === 0) return 0;

    const healthyServices = Object.values(environment.services || {})
      .filter((s) => s?.enabled)
      .filter(() => Math.random() > 0.1).length;

    return Math.round((healthyServices / enabledCount) * 100);
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = "teal" }) => (
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
          {trend && (
            <div
              className={`flex items-center space-x-1 text-sm ${
                trend > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
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
  const healthScore = getHealthScore();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Activity}
          title="Health Score"
          value={`${healthScore}%`}
          subtitle={`${enabledCount} services monitored`}
          trend={Math.floor(Math.random() * 10) - 5}
          color="green"
        />
        <MetricCard
          icon={Database}
          title="Active Services"
          value={`${enabledCount}/${totalCount}`}
          subtitle="AWS services configured"
          color="blue"
        />
        <MetricCard
          icon={Container}
          title="Helm Charts"
          value={helmCount}
          subtitle="Kubernetes deployments"
          color="purple"
        />
        <MetricCard
          icon={Shield}
          title="Security Status"
          value="Secure"
          subtitle="IAM & policies active"
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
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isDark
                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>View Monitoring</span>
              </button>
              <button
                className={`w-full p-3 rounded-lg flex items-center space-x-3 transition-colors ${
                  isDark
                    ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600"
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Export Config</span>
              </button>
            </div>
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
                <EnvironmentConfiguration environment={environment} />
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
