// src/components/modals/wizard/ServicesConfigStep.js
import React from 'react';
import { Settings, Info } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { PROVIDERS } from '../../../config/environmentsConfig';
import DynamicServicesGrid from '../../DynamicServicesGrid';

const ServicesConfigStep = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onEditHelmValues,
  onAskAI
}) => {
  const { isDark } = useTheme();

  const getEnabledServicesCount = () => {
    if (!newEnv.services) return 0;
    return Object.values(newEnv.services).filter(service => service?.enabled).length;
  };

  const getProviderDisplayName = () => {
    return PROVIDERS[newEnv.type]?.name || 'Cloud Provider';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 ${
          isDark
            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
            : 'bg-teal-500/10 text-teal-700 border border-teal-500/30'
        }`}>
          <Settings className="w-4 h-4 mr-2" />
          Services Configuration
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Configure {getProviderDisplayName()} Services
        </h3>
        <p className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Select and configure the cloud services you need for your environment
        </p>
      </div>

      {/* Environment Summary */}
      <div className={`p-4 rounded-lg border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Environment: {newEnv.name}
            </span>
            <span className={`ml-4 text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {getProviderDisplayName()} • {PROVIDERS[newEnv.type]?.regions.find(r => r.value === newEnv.region)?.label}
            </span>
          </div>
          <div className={`text-sm px-3 py-1 rounded-full ${
            getEnabledServicesCount() > 0
              ? isDark
                ? 'bg-teal-500/20 text-teal-300'
                : 'bg-teal-100 text-teal-700'
              : isDark
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {getEnabledServicesCount()} services selected
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className={`p-4 rounded-lg border ${
        isDark
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}>
        <div className="flex items-start">
          <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Service Configuration Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
              <li>Start with essential services like VPC and compute resources</li>
              <li>Enable additional services based on your application requirements</li>
              <li>You can always modify these configurations later</li>
              <li>Services with dependencies will show relevant warnings if prerequisites are missing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Enable Suggestions */}
      {getEnabledServicesCount() === 0 && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="text-center">
            <h4 className={`text-sm font-medium mb-2 ${
              isDark ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              Need some suggestions?
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {newEnv.type === 'aws' && (
                <>
                  <button
                    onClick={() => {
                      setNewEnv({
                        ...newEnv,
                        services: {
                          ...newEnv.services,
                          vpc: { ...newEnv.services.vpc, enabled: true },
                          eks: { ...newEnv.services.eks, enabled: true }
                        }
                      });
                    }}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      isDark
                        ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                        : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    }`}
                  >
                    Enable VPC + EKS
                  </button>
                  <button
                    onClick={() => {
                      setNewEnv({
                        ...newEnv,
                        services: {
                          ...newEnv.services,
                          vpc: { ...newEnv.services.vpc, enabled: true },
                          rds: { ...newEnv.services.rds, enabled: true },
                          s3: { ...newEnv.services.s3, enabled: true }
                        }
                      });
                    }}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      isDark
                        ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                        : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    }`}
                  >
                    Enable Basic Stack
                  </button>
                </>
              )}
              {newEnv.type === 'azure' && (
                <button
                  onClick={() => {
                    setNewEnv({
                      ...newEnv,
                      services: {
                        ...newEnv.services,
                        vnet: { ...newEnv.services.vnet, enabled: true },
                        aks: { ...newEnv.services.aks, enabled: true }
                      }
                    });
                  }}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    isDark
                      ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                >
                  Enable VNet + AKS
                </button>
              )}
              {newEnv.type === 'gcp' && (
                <button
                  onClick={() => {
                    setNewEnv({
                      ...newEnv,
                      services: {
                        ...newEnv.services,
                        gke: { ...newEnv.services.gke, enabled: true }
                      }
                    });
                  }}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    isDark
                      ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                >
                  Enable GKE
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Available {getProviderDisplayName()} Services
          </label>
          {getEnabledServicesCount() > 0 && (
            <button
              onClick={() => {
                // Disable all services
                const updatedServices = { ...newEnv.services };
                Object.keys(updatedServices).forEach(key => {
                  if (updatedServices[key]) {
                    updatedServices[key] = { ...updatedServices[key], enabled: false };
                  }
                });
                setNewEnv({ ...newEnv, services: updatedServices });
              }}
              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                isDark
                  ? 'text-orange-400 hover:bg-orange-500/20'
                  : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              Disable All
            </button>
          )}
        </div>

        <DynamicServicesGrid
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onEditHelmValues={onEditHelmValues}
          onAskAI={onAskAI}
        />
      </div>

      {/* Next Step Preview */}
      {(newEnv.services?.eks?.enabled || newEnv.services?.aks?.enabled || newEnv.services?.gke?.enabled || newEnv.services?.kubernetes?.enabled) && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            : 'bg-teal-50 border-teal-200 text-teal-700'
        }`}>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">
              Kubernetes service detected! Next step will allow you to configure Helm charts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesConfigStep;
