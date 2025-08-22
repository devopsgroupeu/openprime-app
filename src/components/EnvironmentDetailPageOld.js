import React, { useState } from 'react';
import {
  ArrowLeft, Settings, Download, Trash2, Edit2, Eye, EyeOff,
  Cloud, Server, MapPin, Activity, Package, Database,
  Network, Container, Archive, Shield, Box, Lock,
  MessageSquare, CheckCircle, Clock, Copy, Layers
} from 'lucide-react';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import { getServiceConfig } from '../config/servicesConfig';
import { getProviderConfig } from '../config/providersConfig';

const EnvironmentDetailPage = ({
  environment,
  onBack,
  onEdit,
  onDelete,
  setCurrentPage,
  currentPage
}) => {
  const { isDark } = useTheme();
  const { success } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    services: true,
    helmCharts: false,
    repositories: false,
    configuration: false
  });
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  if (!environment) {
    return <div>Environment not found</div>;
  }

  const providerConfig = getProviderConfig(environment.type);

  const getProviderIcon = (type) => {
    const iconColors = {
      'aws': 'text-orange-400',
      'azure': 'text-blue-400',
      'gcp': 'text-green-400',
      'onpremise': 'text-gray-400'
    };

    const colorClass = iconColors[type] || 'text-gray-400';
    const IconComponent = type === 'onpremise' ? Server : Cloud;

    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  // Dynamic icon mapping based on service category
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Networking': Network,
      'Compute': Box,
      'Database': Database,
      'Storage': Archive,
      'Security': Shield,
      'Integration': MessageSquare,
      'Observability': Activity
    };
    return iconMap[category] || Layers;
  };

  const getServiceIcon = (serviceName) => {
    const serviceConfig = getServiceConfig(serviceName);
    if (!serviceConfig) {
      return <Layers className="w-4 h-4 text-gray-400" />;
    }

    const IconComponent = getCategoryIcon(serviceConfig.category);
    const providerColors = {
      'aws': 'text-teal-500',
      'azure': 'text-blue-400',
      'gcp': 'text-green-400',
      'onpremise': 'text-purple-400'
    };

    const colorClass = providerColors[serviceConfig.provider] || 'text-gray-400';
    return <IconComponent className={`w-4 h-4 ${colorClass}`} />;
  };

  const getServiceDisplayName = (serviceName) => {
    const serviceConfig = getServiceConfig(serviceName);
    return serviceConfig ? serviceConfig.displayName :
      serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    success(`${label} copied to clipboard`, { duration: 2000 });
  };

  const enabledServices = environment.services ?
    Object.entries(environment.services).filter(([_, config]) => config?.enabled) : [];

  // Dynamically find kubernetes service based on enabled services
  const getKubernetesService = () => {
    if (!environment.services) return null;

    for (const [serviceName, serviceConfig] of Object.entries(environment.services)) {
      if (serviceConfig?.enabled) {
        const config = getServiceConfig(serviceName);
        if (config?.category === 'Compute' &&
            (serviceName.toLowerCase().includes('k8s') ||
             serviceName.toLowerCase().includes('kubernetes') ||
             serviceName === 'eks' || serviceName === 'aks' || serviceName === 'gke')) {
          return { name: serviceName, config: serviceConfig };
        }
      }
    }
    return null;
  };

  const kubernetesService = getKubernetesService();
  const helmCharts = kubernetesService?.config?.helmCharts ?
    Object.entries(kubernetesService.config.helmCharts)
      .filter(([_, config]) => config.enabled) : [];

  // Dynamically find container registry repositories
  const getContainerRepositories = () => {
    const repos = [];
    if (!environment.services) return repos;

    for (const serviceConfig of Object.values(environment.services)) {
      if (serviceConfig?.enabled && serviceConfig?.repositories) {
        repos.push(...serviceConfig.repositories);
      }
    }
    return repos;
  };

  const repositories = getContainerRepositories();

  const handleDeleteConfirm = () => {
    onDelete(environment.id);
    setShowDeleteModal(false);
    onBack(); // Navigate back after deletion
  };

  const formatConfigValue = (key, value) => {
    if (typeof value === 'boolean') {
      return value ? 'Enabled' : 'Disabled';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return value?.toString() || 'Not set';
  };

  const isSensitiveField = (key) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900'
        : 'bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50'
    }`}>
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {environment.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  {getProviderIcon(environment.type)}
                  <span className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {providerConfig.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className={`w-4 h-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {environment.region || environment.location}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                  environment.status === 'running' ?
                    'bg-green-500/20 text-green-400' :
                    'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {environment.status === 'running' ?
                    <CheckCircle className="w-3 h-3 mr-1" /> :
                    <Clock className="w-3 h-3 mr-1" />}
                  {environment.status === 'running' ? 'Running' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => onEdit(environment)}
              className="px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg hover:bg-teal-600/30 transition-all flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </button>
            <button className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Section */}
            <div className={`rounded-xl border p-6 ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white/70 border-gray-200'
            }`}>
              <button
                onClick={() => toggleSection('overview')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className={`text-xl font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Environment Overview
                </h2>
                {expandedSections.overview ?
                  <Eye className="w-5 h-5 text-gray-400" /> :
                  <EyeOff className="w-5 h-5 text-gray-400" />}
              </button>

              {expandedSections.overview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Environment ID
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`font-mono text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          #{environment.id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(environment.id.toString(), 'Environment ID')}
                          className="p-1 hover:bg-gray-500/20 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Activity className={`w-4 h-4 ${
                          environment.status === 'running' ? 'text-green-400' : 'text-yellow-400'
                        }`} />
                        <span className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {environment.status === 'running' ? 'Active and Running' : 'Deployment Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Provider Configuration
                    </label>
                    <div className={`mt-2 p-3 rounded-lg ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Provider:
                          </span>
                          <span className={`ml-2 font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {providerConfig.name}
                          </span>
                        </div>
                        <div>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Region/Location:
                          </span>
                          <span className={`ml-2 font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {environment.region || environment.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {enabledServices.length > 0 && (
                    <div>
                      <label className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Service Summary
                      </label>
                      <div className={`mt-2 p-3 rounded-lg ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Services Configured:
                          </span>
                          <span className={`font-bold text-lg ${
                            isDark ? 'text-teal-400' : 'text-teal-600'
                          }`}>
                            {enabledServices.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Services Configuration Section */}
            {enabledServices.length > 0 && (
              <div className={`rounded-xl border p-6 ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white/70 border-gray-200'
              }`}>
                <button
                  onClick={() => toggleSection('services')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className={`text-xl font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Service Configuration ({enabledServices.length})
                  </h2>
                  {expandedSections.services ?
                    <Eye className="w-5 h-5 text-gray-400" /> :
                    <EyeOff className="w-5 h-5 text-gray-400" />}
                </button>

                {expandedSections.services && (
                  <div className="space-y-4">
                    {enabledServices.map(([serviceName, serviceConfig]) => (
                      <div key={serviceName} className={`border rounded-lg p-4 ${
                        isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getServiceIcon(serviceName)}
                            <div>
                              <h3 className={`font-semibold ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {getServiceDisplayName(serviceName)}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                              }`}>
                                Enabled
                              </span>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>

                        {/* Service Configuration Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {Object.entries(serviceConfig)
                            .filter(([configKey]) => configKey !== 'enabled')
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key}>
                                <span className={`${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </span>
                                <span className={`ml-2 ${
                                  isSensitiveField(key) && !showSensitiveData ?
                                    'font-mono text-gray-500' :
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {isSensitiveField(key) && !showSensitiveData ?
                                    '••••••••' :
                                    formatConfigValue(key, value)}
                                </span>
                              </div>
                            ))}
                        </div>

                        {Object.keys(serviceConfig).length > 5 && (
                          <button
                            onClick={() => toggleSection(`config_${serviceName}`)}
                            className={`mt-3 text-xs ${
                              isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
                            }`}
                          >
                            {expandedSections[`config_${serviceName}`] ? 'Show Less' : `Show ${Object.keys(serviceConfig).length - 5} More Settings`}
                          </button>
                        )}

                        {expandedSections[`config_${serviceName}`] && (
                          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {Object.entries(serviceConfig)
                                .filter(([key]) => key !== 'enabled')
                                .slice(4)
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <span className={`${
                                      isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                    </span>
                                    <span className={`ml-2 ${
                                      isSensitiveField(key) && !showSensitiveData ?
                                        'font-mono text-gray-500' :
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {isSensitiveField(key) && !showSensitiveData ?
                                        '••••••••' :
                                        formatConfigValue(key, value)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Helm Charts Section */}
            {helmCharts.length > 0 && (
              <div className={`rounded-xl border p-6 ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white/70 border-gray-200'
              }`}>
                <button
                  onClick={() => toggleSection('helmCharts')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className={`text-xl font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Helm Charts ({helmCharts.length})
                  </h2>
                  {expandedSections.helmCharts ?
                    <Eye className="w-5 h-5 text-gray-400" /> :
                    <EyeOff className="w-5 h-5 text-gray-400" />}
                </button>

                {expandedSections.helmCharts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {helmCharts.map(([chartName, chartConfig]) => (
                      <div key={chartName} className={`border rounded-lg p-4 ${
                        isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Package className="w-5 h-5 text-green-400" />
                            <div>
                              <h3 className={`font-medium ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>
                                {chartName.charAt(0).toUpperCase() + chartName.slice(1)}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                              }`}>
                                Deployed
                              </span>
                            </div>
                          </div>
                          {chartConfig.customValues && (
                            <Edit2 className="w-4 h-4 text-yellow-400" title="Custom values configured" />
                          )}
                        </div>
                        <div className={`mt-2 text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {chartConfig.customValues ? 'Custom configuration' : 'Default configuration'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Container Repositories Section */}
            {repositories.length > 0 && (
              <div className={`rounded-xl border p-6 ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white/70 border-gray-200'
              }`}>
                <button
                  onClick={() => toggleSection('repositories')}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className={`text-xl font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Container Repositories ({repositories.length})
                  </h2>
                  {expandedSections.repositories ?
                    <Eye className="w-5 h-5 text-gray-400" /> :
                    <EyeOff className="w-5 h-5 text-gray-400" />}
                </button>

                {expandedSections.repositories && (
                  <div className="space-y-3">
                    {repositories.map((repo, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Container className="w-4 h-4 text-blue-400" />
                          <span className={`font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {repo.name}
                          </span>
                          {repo.scanOnPush && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              Scan Enabled
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {repo.mutability || repo.sku || 'Standard'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Information */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className={`rounded-xl border p-6 ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Active Services
                  </span>
                  <span className={`font-bold text-lg ${
                    isDark ? 'text-teal-400' : 'text-teal-600'
                  }`}>
                    {enabledServices.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Helm Charts
                  </span>
                  <span className={`font-bold text-lg ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {helmCharts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Repositories
                  </span>
                  <span className={`font-bold text-lg ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {repositories.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & Compliance */}
            <div className={`rounded-xl border p-6 ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Security & Compliance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      className={`flex items-center space-x-2 text-sm ${
                        isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {showSensitiveData ?
                        <EyeOff className="w-4 h-4" /> :
                        <Eye className="w-4 h-4" />}
                      <span>
                        {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Encryption Enabled
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Access Control Configured
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Best Practices Applied
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Actions */}
            <div className={`rounded-xl border p-6 ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Environment Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => onEdit(environment)}
                  className="w-full px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg hover:bg-teal-600/30 transition-all flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Configuration
                </button>
                <button className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export as YAML
                </button>
                <button className="w-full px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all flex items-center justify-center">
                  <Copy className="w-4 h-4 mr-2" />
                  Clone Environment
                </button>
              </div>
            </div>

            {/* Environment Info */}
            <div className={`rounded-xl border p-6 ${
              isDark
                ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Environment Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className={`${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Created:
                  </span>
                  <span className={`ml-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className={`${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Last Modified:
                  </span>
                  <span className={`ml-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className={`${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Environment Type:
                  </span>
                  <span className={`ml-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {providerConfig.name} Environment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default EnvironmentDetailPage;
