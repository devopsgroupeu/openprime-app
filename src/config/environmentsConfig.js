// src/config/environmentsConfig.js
import {
  PROVIDERS_CONFIG,
  getProviderConfig,
  getProviderServices,
} from "./providersConfig";
import { createDefaultServiceConfig } from "./servicesConfig";
import { generateDefaultHelmChartsConfig } from "./helmChartsConfig";

// Re-export providers from the new configuration
export const PROVIDERS = PROVIDERS_CONFIG;

export const createEmptyEnvironment = (providerType = "aws") => ({
  name: "",
  globalPrefix: "",
  provider: providerType,
  region: getProviderConfig(providerType).defaultRegion,
  services: createEmptyServices(providerType),
});

const createEmptyServices = (providerType) => {
  const providerServices = getProviderServices(providerType);
  const services = {};

  providerServices.forEach((serviceName) => {
    services[serviceName] = createDefaultServiceConfig(serviceName);

    // Initialize helmCharts for Kubernetes services
    if (["eks", "aks", "gke", "kubernetes"].includes(serviceName)) {
      services[serviceName].helmCharts =
        generateDefaultHelmChartsConfig(serviceName);
    }
  });

  return services;
};
