import { useState } from "react";
import {
  Database,
  Network,
  Container,
  Archive,
  Shield,
  Box,
  Lock,
  Package,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { getServiceConfig } from "../../config/servicesConfig";

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
      iam: Shield,
    };
    return icons[serviceName] || Box;
  };

  // const getServiceStatus = (serviceConfig) => {
  //   if (!serviceConfig?.enabled) return 'disabled';
  //   return 'enabled';
  // };

  // const getStatusIcon = (status) => {
  //   if (status === 'enabled') {
  //     return <CheckCircle className="w-4 h-4 text-green-400" />;
  //   }
  //   return <Clock className="w-4 h-4 text-gray-400" />;
  // };

  const enabledServices = Object.entries(environment.services || {})
    .filter(([_, config]) => config?.enabled)
    .sort(([a], [b]) => a.localeCompare(b));

  const toggleServiceExpansion = (serviceName) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const copyConfiguration = (config, serviceName) => {
    const configText = JSON.stringify(config, null, 2);
    navigator.clipboard
      .writeText(configText)
      .then(() => {
        success(
          `${serviceName.toUpperCase()} configuration copied to clipboard`,
        );
      })
      .catch(() => {
        success("Failed to copy configuration");
      });
  };

  const formatConfigValue = (value) => {
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getImportantAttributes = (serviceConfig, serviceName) => {
    const importantKeys = {
      vpc: ["cidrBlock", "region", "enableDnsSupport"],
      eks: ["version", "nodeGroups", "addons"],
      rds: ["engine", "instanceType", "allocatedStorage"],
      s3: ["bucketName", "versioning", "encryption"],
      ecr: ["repositoryName", "imageScanningConfiguration"],
      opensearch: ["version", "instanceType", "instanceCount"],
      lambda: ["runtime", "memorySize", "timeout"],
      elasticache: ["engine", "nodeType", "numNodes"],
      secretsmanager: ["secretName", "description"],
      iam: ["roleName", "policies"],
    };

    const keys =
      importantKeys[serviceName] || Object.keys(serviceConfig).slice(0, 3);
    return Object.entries(serviceConfig)
      .filter(([key]) => keys.includes(key) && key !== "enabled")
      .slice(0, 4);
  };

  const ServiceItem = ({ serviceName, serviceConfig }) => {
    const serviceDefinition = getServiceConfig(serviceName);
    const IconComponent = getServiceIcon(serviceName);
    const isExpanded = expandedServices[serviceName];
    const importantAttrs = getImportantAttributes(serviceConfig, serviceName);

    return (
      <div className="rounded-2xl border bg-surface border-border transition-all duration-200 hover:shadow-lg">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-primary-muted border border-primary">
                <IconComponent className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-bold text-primary">
                    {serviceDefinition?.displayName ||
                      serviceName.toUpperCase()}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-muted text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Active
                  </span>
                </div>
                <p className="text-sm text-secondary">
                  {serviceDefinition?.description ||
                    "AWS service configuration"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyConfiguration(serviceConfig, serviceName)}
                className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                title="Copy configuration"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleServiceExpansion(serviceName)}
                className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
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
                <div
                  key={key}
                  className="p-3 rounded-lg border bg-background border-border"
                >
                  <div className="section-label mb-1">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </div>
                  <div className="text-sm font-mono text-primary">
                    {formatConfigValue(value).length > 30
                      ? formatConfigValue(value).substring(0, 30) + "..."
                      : formatConfigValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className="border-t px-6 pb-6 border-border">
            <div className={`flex items-center justify-between mb-4 pt-4`}>
              <h5 className="text-sm font-semibold flex items-center space-x-2 text-secondary">
                <Info className="w-4 h-4" />
                <span>Complete Configuration</span>
              </h5>
              <span className="text-xs text-tertiary">
                {Object.keys(serviceConfig).length - 1} attributes
              </span>
            </div>

            <div
              className={`max-h-80 overflow-y-auto space-y-3 ${
                isDark ? "scrollbar-dark" : "scrollbar-light"
              }`}
            >
              {Object.entries(serviceConfig)
                .filter(([key]) => key !== "enabled")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 rounded-lg border bg-surface border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-secondary">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          typeof value === "object"
                            ? "bg-primary-muted text-primary"
                            : typeof value === "boolean"
                              ? "bg-primary-muted text-primary"
                              : typeof value === "number"
                                ? "bg-success-muted text-success"
                                : "bg-background text-tertiary"
                        }`}
                      >
                        {typeof value === "object" ? "Object" : typeof value}
                      </span>
                    </div>
                    <pre className="text-xs font-mono p-2 rounded border overflow-x-auto bg-background border-border text-secondary">
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
          <div className="text-center py-12 text-secondary">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2 text-secondary">
              No Services Enabled
            </h3>
            <p className="text-sm">
              Enable services to see their configuration details here.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ServicesList;
