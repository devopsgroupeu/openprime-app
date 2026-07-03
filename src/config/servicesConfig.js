// src/config/servicesConfig.js
// Aggregates the per-provider service schemas into a single SERVICES_CONFIG.
// Service definitions live in ./services/<provider>.js; shared field constants
// in ./services/fieldTypes.js. Public API (SERVICES_CONFIG, FIELD_TYPES,
// FIELD_SECTIONS, helpers) is unchanged.
export { FIELD_TYPES, FIELD_SECTIONS } from "./services/fieldTypes";

import { awsServices } from "./services/aws";
import { azureServices } from "./services/azure";
import { gcpServices } from "./services/gcp";
import { onpremServices } from "./services/onprem";

export const SERVICES_CONFIG = {
  ...awsServices,
  ...azureServices,
  ...gcpServices,
  ...onpremServices,
};

export const getServiceConfig = (serviceName) => {
  return SERVICES_CONFIG[serviceName];
};

export const getServicesByProvider = (providerType) => {
  return Object.values(SERVICES_CONFIG).filter(
    (service) => service.provider === providerType,
  );
};

export const getServicesByCategory = (category) => {
  return Object.values(SERVICES_CONFIG).filter(
    (service) => service.category === category,
  );
};

export const createDefaultServiceConfig = (serviceName) => {
  const config = getServiceConfig(serviceName);
  if (!config) return {};

  const defaultConfig = {};
  for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
    defaultConfig[fieldName] = fieldConfig.defaultValue;
  }

  return defaultConfig;
};
