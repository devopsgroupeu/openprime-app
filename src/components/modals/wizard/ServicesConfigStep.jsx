// src/components/modals/wizard/ServicesConfigStep.js
import { Settings, Info, ToggleLeft, ToggleRight } from "lucide-react";
import { PROVIDERS } from "../../../config/environmentsConfig";
import DynamicServicesGrid from "../../DynamicServicesGrid";
import { createDefaultServiceConfig } from "../../../config/servicesConfig";

const ServicesConfigStep = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onEditHelmValues,
  onAskAI,
}) => {
  const getEnabledServicesCount = () => {
    if (!newEnv.services) return 0;
    return Object.values(newEnv.services).filter((service) => service?.enabled)
      .length;
  };

  const getTotalServicesCount = () => {
    if (!newEnv.services) return 0;
    return Object.keys(newEnv.services).length;
  };

  const areAllServicesEnabled = () => {
    if (!newEnv.services) return false;
    const services = Object.values(newEnv.services);
    return services.length > 0 && services.every((service) => service?.enabled);
  };

  const handleToggleAllServices = () => {
    if (!newEnv.services) return;

    const allEnabled = areAllServicesEnabled();
    const updatedServices = {};

    Object.keys(newEnv.services).forEach((serviceName) => {
      const currentService = newEnv.services[serviceName];
      if (!allEnabled) {
        // Enable all services with default config
        updatedServices[serviceName] = {
          ...createDefaultServiceConfig(serviceName),
          enabled: true,
        };
      } else {
        // Disable all services
        updatedServices[serviceName] = {
          ...currentService,
          enabled: false,
        };
      }
    });

    setNewEnv({
      ...newEnv,
      services: updatedServices,
    });
  };

  const getProviderDisplayName = () => {
    return PROVIDERS[newEnv.provider]?.name || "Cloud Provider";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 bg-primary-muted text-primary border border-primary">
          <Settings className="w-4 h-4 mr-2" />
          Services Configuration
        </div>
        <h3 className="text-xl font-bold mb-2 text-primary">
          Configure {getProviderDisplayName()} Services
        </h3>
        <p className="text-sm text-secondary">
          Select and configure the cloud services you need for your environment
        </p>
      </div>

      {/* Environment Summary */}
      <div className="p-4 rounded-lg border bg-surface border-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-secondary">
              Environment: {newEnv.name}
            </span>
            <span className="ml-4 text-sm text-secondary">
              {getProviderDisplayName()} •{" "}
              {
                PROVIDERS[newEnv.provider]?.regions.find(
                  (r) => r.value === newEnv.region,
                )?.label
              }
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`text-sm px-3 py-1 rounded-full ${
                getEnabledServicesCount() > 0
                  ? "bg-primary-muted text-primary"
                  : "bg-background-secondary text-tertiary"
              }`}
            >
              {getEnabledServicesCount()} / {getTotalServicesCount()} services
            </div>
            <button
              onClick={handleToggleAllServices}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                areAllServicesEnabled()
                  ? "bg-danger-muted text-danger hover:bg-danger-muted border-danger"
                  : "bg-primary-muted text-primary hover:bg-primary-muted border-primary"
              }`}
              data-testid="toggle-all-services"
            >
              {areAllServicesEnabled() ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Disable All
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Enable All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
        <div className="flex items-start">
          <Info className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Service Configuration Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-80">
              <li>
                Start with essential services like VPC and compute resources
              </li>
              <li>
                Enable additional services based on your application
                requirements
              </li>
              <li>You can always modify these configurations later</li>
              <li>
                Services with dependencies will show relevant warnings if
                prerequisites are missing
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Enable Suggestions */}
      {getEnabledServicesCount() === 0 && (
        <div className="p-4 rounded-lg border bg-warning-muted border-warning">
          <div className="text-center">
            <h4 className="section-label mb-2 text-warning">
              Need some suggestions?
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {newEnv.provider === "aws" && (
                <>
                  <button
                    onClick={() => {
                      setNewEnv({
                        ...newEnv,
                        services: {
                          ...newEnv.services,
                          vpc: {
                            ...newEnv.services.vpc,
                            enabled: true,
                          },
                          eks: {
                            ...newEnv.services.eks,
                            enabled: true,
                          },
                        },
                      });
                    }}
                    className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
                  >
                    Enable VPC + EKS
                  </button>
                  <button
                    onClick={() => {
                      setNewEnv({
                        ...newEnv,
                        services: {
                          ...newEnv.services,
                          vpc: {
                            ...newEnv.services.vpc,
                            enabled: true,
                          },
                          rds: {
                            ...newEnv.services.rds,
                            enabled: true,
                          },
                          s3: {
                            ...newEnv.services.s3,
                            enabled: true,
                          },
                        },
                      });
                    }}
                    className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
                  >
                    Enable Basic Stack
                  </button>
                </>
              )}
              {newEnv.provider === "azure" && (
                <button
                  onClick={() => {
                    setNewEnv({
                      ...newEnv,
                      services: {
                        ...newEnv.services,
                        vnet: {
                          ...newEnv.services.vnet,
                          enabled: true,
                        },
                        aks: {
                          ...newEnv.services.aks,
                          enabled: true,
                        },
                      },
                    });
                  }}
                  className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
                >
                  Enable VNet + AKS
                </button>
              )}
              {newEnv.provider === "gcp" && (
                <button
                  onClick={() => {
                    setNewEnv({
                      ...newEnv,
                      services: {
                        ...newEnv.services,
                        gke: {
                          ...newEnv.services.gke,
                          enabled: true,
                        },
                      },
                    });
                  }}
                  className="text-xs px-3 py-1 rounded-full transition-colors bg-primary-muted text-primary hover:bg-primary-muted"
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
          <label className="section-label">
            Available {getProviderDisplayName()} Services
          </label>
          {getEnabledServicesCount() > 0 && (
            <button
              onClick={() => {
                // Disable all services
                const updatedServices = { ...newEnv.services };
                Object.keys(updatedServices).forEach((key) => {
                  if (updatedServices[key]) {
                    updatedServices[key] = {
                      ...updatedServices[key],
                      enabled: false,
                    };
                  }
                });
                setNewEnv({
                  ...newEnv,
                  services: updatedServices,
                });
              }}
              className="text-xs px-3 py-1 rounded-lg transition-colors text-warning hover:bg-warning-muted"
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
      {(newEnv.services?.eks?.enabled ||
        newEnv.services?.aks?.enabled ||
        newEnv.services?.gke?.enabled ||
        newEnv.services?.kubernetes?.enabled) && (
        <div className="p-4 rounded-lg border bg-primary-muted border-primary text-primary">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
            <span className="text-sm font-medium">
              Kubernetes service detected! Next step will allow you to configure
              Helm charts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesConfigStep;
