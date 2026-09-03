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
  domain: "",
  services: createEmptyServices(providerType),
});

const createEmptyServices = (providerType) =>
  backfillServices({ provider: providerType, services: {} }).services;

/**
 * Add defaults for services the environment has never seen.
 *
 * The wizard grid renders a service only if `env.services[name]` exists, so a
 * saved draft or a stored environment shows the service set that was current
 * when it was written. That was harmless while the set only changed on a
 * frontend deploy; with the runtime catalog it changes when the templates do,
 * and a customer editing an existing environment would silently never be
 * offered the new service.
 *
 * Only adds. A service the catalog no longer describes keeps its saved
 * configuration — the grid stops offering it, but nothing is thrown away.
 */
export const backfillServices = (env) => {
  if (!env) return env;
  const services = { ...(env.services || {}) };

  for (const serviceName of getProviderServices(env.provider)) {
    if (services[serviceName]) continue;
    services[serviceName] = createDefaultServiceConfig(serviceName);
    if (["eks", "aks", "gke", "kubernetes"].includes(serviceName)) {
      services[serviceName].helmCharts =
        generateDefaultHelmChartsConfig(serviceName);
    }
  }

  return { ...env, services };
};
