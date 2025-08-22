import React, { useState } from 'react';
import {
  Database, Network, Container, Archive, Shield, Box, Lock,
  CheckCircle, Clock, Package, ChevronDown, ChevronRight,
  Copy, ExternalLink, Info
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { getServiceConfig } from '../../config/servicesConfig';

const ServicesList = ({ environment }) => {
  const { isDark } = useTheme();
  const { success } = useToast();
  const [expandedServices, setExpandedServices] = useState({});

  const getServiceIcon = (serviceName) => {
    const icons = {
      vpc: Network,
      eks: Container,
      rds: Database,
      s3: Archive,
      ecr: Package,
      opensearch: Database,
      lambda: Box,
      elasticache: Database,
      secretsmanager: Lock,
      iam: Shield
    };
    return icons[serviceName] || Box;
  };

  const getServiceStatus = (serviceConfig) => {
    if (!serviceConfig?.enabled) return 'disabled';
    return 'enabled';
  };

  const getStatusIcon = (status) => {
    if (status === 'enabled') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const enabledServices = Object.entries(environment.services || {})
    .filter(([_, config]) => config?.enabled)
    .sort(([a], [b]) => a.localeCompare(b));

  const toggleServiceExpansion = (serviceName) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const copyConfiguration = (config, serviceName) => {
    const configText = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configText).then(() => {
      success(`${serviceName.toUpperCase()} configuration copied to clipboard`);
    }).catch(() => {
      success('Failed to copy configuration');
    });
  };

  const getServiceTypeColor = (serviceName) => {
    const colors = {
      vpc: 'blue',
      eks: 'purple',
      rds: 'green',
      s3: 'orange',
      ecr: 'indigo',
      opensearch: 'yellow',
      lambda: 'pink',
      elasticache: 'red',
      secretsmanager: 'gray',
      iam: 'teal'
    };
    return colors[serviceName] || 'gray';
  };

  const formatConfigValue = (value) => {
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getImportantAttributes = (serviceConfig, serviceName) => {
    const importantKeys = {
      vpc: ['cidrBlock', 'region', 'enableDnsSupport'],
      eks: ['version', 'nodeGroups', 'addons'],
      rds: ['engine', 'instanceType', 'allocatedStorage'],
      s3: ['bucketName', 'versioning', 'encryption'],
      ecr: ['repositoryName', 'imageScanningConfiguration'],
      opensearch: ['version', 'instanceType', 'instanceCount'],
      lambda: ['runtime', 'memorySize', 'timeout'],
      elasticache: ['engine', 'nodeType', 'numNodes'],
      secretsmanager: ['secretName', 'description'],
      iam: ['roleName', 'policies']
    };

    const keys = importantKeys[serviceName] || Object.keys(serviceConfig).slice(0, 3);
    return Object.entries(serviceConfig)
      .filter(([key]) => keys.includes(key) && key !== 'enabled')
      .slice(0, 4);
  };

  const ServiceItem = ({ serviceName, serviceConfig }) => {
    const serviceDefinition = getServiceConfig(serviceName);
    const IconComponent = getServiceIcon(serviceName);
    const isExpanded = expandedServices[serviceName];
    const serviceColor = getServiceTypeColor(serviceName);
    const importantAttrs = getImportantAttributes(serviceConfig, serviceName);

    return (
      <div className={`rounded-xl border transition-all duration-200 hover:shadow-lg ${
        isDark
          ? 'bg-gray-800/60 border-gray-700 hover:bg-gray-800/80'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg bg-${serviceColor}-500/10 border border-${serviceColor}-500/20`}>
                <IconComponent className={`w-6 h-6 text-${serviceColor}-500`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {serviceDefinition?.displayName || serviceName.toUpperCase()}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500 border border-green-500/20`}>
                    Active
                  </span>
                </div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {serviceDefinition?.description || 'AWS service configuration'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyConfiguration(serviceConfig, serviceName)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Copy configuration"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleServiceExpansion(serviceName)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Overview - Important Attributes */}
          {importantAttrs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {importantAttrs.map(([key, value]) => (
                <div key={key} className={`p-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700/30 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-xs font-medium mb-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className={`text-sm font-mono ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {formatConfigValue(value).length > 30
                      ? formatConfigValue(value).substring(0, 30) + '...'
                      : formatConfigValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className={`border-t px-6 pb-6 ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`flex items-center justify-between mb-4 pt-4`}>
              <h5 className={`text-sm font-semibold flex items-center space-x-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Info className="w-4 h-4" />
                <span>Complete Configuration</span>
              </h5>
              <span className={`text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {Object.keys(serviceConfig).length - 1} attributes
              </span>
            </div>

            <div className={`max-h-80 overflow-y-auto space-y-3 ${
              isDark ? 'scrollbar-dark' : 'scrollbar-light'
            }`}>
              {Object.entries(serviceConfig)
                .filter(([key]) => key !== 'enabled')
                .map(([key, value]) => (
                  <div key={key} className={`p-3 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800/40 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        typeof value === 'object'
                          ? 'bg-purple-500/10 text-purple-500'
                          : typeof value === 'boolean'
                          ? 'bg-blue-500/10 text-blue-500'
                          : typeof value === 'number'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {typeof value === 'object' ? 'Object' : typeof value}
                      </span>
                    </div>
                    <pre className={`text-xs font-mono p-2 rounded border overflow-x-auto ${
                      isDark
                        ? 'bg-gray-900 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}>
                      {formatConfigValue(value)}
                    </pre>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .scrollbar-light {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db #f9fafb;
        }
        .scrollbar-light::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-light::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .scrollbar-dark {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }
        .scrollbar-dark::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      <div className="space-y-6">
        {enabledServices.length > 0 ? (
          <div className="space-y-6">
            {enabledServices.map(([serviceName, serviceConfig]) => (
              <ServiceItem
                key={serviceName}
                serviceName={serviceName}
                serviceConfig={serviceConfig}
              />
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className={`text-lg font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Services Enabled
            </h3>
            <p className="text-sm">Enable services to see their configuration details here.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ServicesList;
