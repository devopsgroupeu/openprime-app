// Normalizes an environment as returned by the API into the shape the wizard
// works with.
//
// The API serializes snake_case (global_prefix, terraform_backend, ...) while
// the wizard reads camelCase throughout. Detail/card components each carry
// their own `camel || snake` fallback, but the wizard has none — so before this
// normalizer every "Save Changes" on a real environment failed its
// name/globalPrefix guard, and the only way back to step 1 showed an empty,
// editable Global Prefix whose re-entry silently renames every Terraform
// resource. Normalizing once at the load boundary keeps the API contract
// unchanged and gives the wizard a single shape to reason about.

import { HELM_CHARTS_CONFIG } from "../config/helmChartsConfig";

// API field -> wizard field. Only fields whose names actually differ.
const FIELD_ALIASES = {
  global_prefix: "globalPrefix",
  terraform_backend: "terraformBackend",
  git_repository: "gitRepository",
  cloud_credential_id: "cloudCredentialId",
  state_key: "stateKey",
};

// Charts the wizard can no longer render or generate. Keeping them in a loaded
// environment inflates the "N charts selected" counters while generation
// silently drops them, so they are removed on load. The stored JSONB is left
// alone — these charts never deployed anything, so there is nothing to migrate.
const pruneRemovedCharts = (helmCharts) => {
  if (!helmCharts || typeof helmCharts !== "object") return helmCharts;
  const kept = Object.entries(helmCharts).filter(([key]) =>
    Object.prototype.hasOwnProperty.call(HELM_CHARTS_CONFIG, key),
  );
  return Object.fromEntries(kept);
};

const normalizeServices = (services) => {
  if (!services || typeof services !== "object") return services;
  return Object.fromEntries(
    Object.entries(services).map(([name, config]) => {
      if (!config || typeof config !== "object" || !config.helmCharts) {
        return [name, config];
      }
      return [
        name,
        { ...config, helmCharts: pruneRemovedCharts(config.helmCharts) },
      ];
    }),
  );
};

export const normalizeEnvironment = (env) => {
  if (!env || typeof env !== "object") return env;

  const normalized = {};
  for (const [key, value] of Object.entries(env)) {
    const target = FIELD_ALIASES[key] || key;
    // An explicit camelCase value from the API always wins over its snake_case
    // alias, so a future backend that serializes camelCase needs no change here.
    if (target !== key && env[target] !== undefined) continue;
    normalized[target] = value;
  }

  if (normalized.services) {
    normalized.services = normalizeServices(normalized.services);
  }

  return normalized;
};

export default normalizeEnvironment;
