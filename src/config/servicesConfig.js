// src/config/servicesConfig.js
// Aggregates the per-provider service schemas into a single SERVICES_CONFIG.
// Service definitions live in ./services/<provider>.js; shared field constants
// in ./services/fieldTypes.js. Public API (SERVICES_CONFIG, FIELD_TYPES,
// FIELD_SECTIONS, helpers) is unchanged.
export { FIELD_TYPES, FIELD_SECTIONS } from "./services/fieldTypes";

import { FIELD_TYPES } from "./services/fieldTypes";
import { awsServices } from "./services/aws";
import { azureServices } from "./services/azure";
import { gcpServices } from "./services/gcp";
import { onpremServices } from "./services/onprem";
import { getEnvFlag } from "../utils/envValidator";

// Read at runtime, not at build time. `import.meta.env` is inlined by Vite when
// the bundle is built, and nothing in the image pipeline sets it: there is no
// Dockerfile ARG, no CI step writing a .env, and no chart value that could
// reach it — so a build-time flag was permanently false in every published
// image, with the only `true` living in .env.mock. Reading it from the runtime
// injection that already carries the Keycloak/API config makes the flag
// settable from GitOps, and — the part that matters operationally — makes it
// *un*settable again without a rebuild and a release.
export const USE_RUNTIME_CATALOG = getEnvFlag(
  "USE_RUNTIME_CATALOG",
  "VITE_USE_RUNTIME_CATALOG",
);

// Azure, GCP and on-prem have no template directories, so no catalog can
// describe them. They stay static under both flag states and the catalog is
// merged over the top of them.
const STATIC_SEED = {
  ...azureServices,
  ...gcpServices,
  ...onpremServices,
};

// Seeded with the static AWS config unconditionally, including when the flag is
// on. That is what makes a catalog outage degrade instead of fail: nothing
// hydrates, and the wizard renders exactly what it renders today.
//
// It does not weaken the flag-on path, because hydrateServicesConfig() deletes
// every key that is not in STATIC_SEED before assigning — so a successful
// hydration still *replaces* the static AWS services rather than merging over
// them, and a service the catalog drops really does disappear.
//
// Hydrated in place rather than replaced: every consumer holds this exact
// object, so mutating it is what lets ~5 files keep synchronous access with no
// signature change. Reassigning the binding would leave them on the old one.
export const SERVICES_CONFIG = { ...STATIC_SEED, ...awsServices };

const CONTROLS = new Set(Object.values(FIELD_TYPES));

function compilePattern(raw, where) {
  if (raw instanceof RegExp) return raw;
  if (typeof raw !== "string") return undefined;
  try {
    return new RegExp(raw);
  } catch {
    // Drop only this pattern. A field that cannot validate is a smaller
    // problem than a wizard that will not render.
    console.warn(`[catalog] ${where}: ignoring an invalid validation pattern`);
    return undefined;
  }
}

function toField(raw, where) {
  const field = { ...raw };

  // FIELD_TYPES has no DYNAMIC_LIST, so the renderer's
  // `case FIELD_TYPES.DYNAMIC_LIST` is `case undefined` — a field with no
  // control lands there and dies on fieldConfig.itemSchema. Coercing to text
  // renders the wrong control; leaving it undefined takes the card down.
  if (!field.type || !CONTROLS.has(field.type)) {
    console.warn(
      `[catalog] ${where}: unknown control ${JSON.stringify(field.type)}, falling back to text`,
    );
    field.type = FIELD_TYPES.TEXT;
  }

  if (raw.validation?.pattern) {
    const pattern = compilePattern(raw.validation.pattern, where);
    field.validation = pattern ? { ...raw.validation, pattern } : undefined;
  }

  return field;
}

function toService(key, raw, provider) {
  const fields = {};
  // Object key order is the render order, so it follows the catalog, which
  // follows the order the decorators appear in the templates.
  for (const [name, field] of Object.entries(raw.fields || {})) {
    fields[name] = toField(field, `${key}.${name}`);
  }

  return {
    ...raw,
    name: key,
    provider,
    fields,
  };
}

/**
 * Replace the catalog-backed services in SERVICES_CONFIG, in place.
 *
 * Throws on a document this build cannot read. A wizard rendered from a
 * schemaVersion it does not understand is worse than one that says it cannot
 * load: the fields look right and mean something else.
 */
export function hydrateServicesConfig(doc) {
  if (!doc || typeof doc !== "object") {
    throw new Error("Catalog is empty");
  }
  if (doc.schemaVersion !== 1) {
    throw new Error(
      `Catalog schemaVersion ${doc.schemaVersion} is not supported by this build`,
    );
  }

  const provider = doc.provider || "aws";
  const hydrated = {};
  for (const [key, service] of Object.entries(doc.services || {})) {
    hydrated[key] = toService(key, service, provider);
  }

  // Drop whatever the previous catalog contributed, keep the static seed.
  for (const key of Object.keys(SERVICES_CONFIG)) {
    if (!(key in STATIC_SEED)) delete SERVICES_CONFIG[key];
  }
  Object.assign(SERVICES_CONFIG, hydrated);

  return SERVICES_CONFIG;
}

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
