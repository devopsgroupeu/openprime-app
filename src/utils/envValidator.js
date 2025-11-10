// Runtime environment configuration for containerized deployments
// Supports both build-time (development) and runtime (container) env injection

const ENV_CONFIG = {
  // Keycloak Authentication
  KEYCLOAK_URL: {
    runtimeKey: "KEYCLOAK_URL",
    buildTimeKey: "REACT_APP_KEYCLOAK_URL",
    description: "Keycloak server URL",
  },
  KEYCLOAK_REALM: {
    runtimeKey: "KEYCLOAK_REALM",
    buildTimeKey: "REACT_APP_KEYCLOAK_REALM",
    description: "Keycloak realm name",
  },
  KEYCLOAK_CLIENT_ID: {
    runtimeKey: "KEYCLOAK_CLIENT_ID",
    buildTimeKey: "REACT_APP_KEYCLOAK_CLIENT_ID",
    description: "Keycloak client ID",
  },

  // API Configuration
  API_URL: {
    runtimeKey: "API_URL",
    buildTimeKey: "REACT_APP_API_URL",
    description: "Backend API URL",
  },
};

/**
 * Get environment variable with runtime and build-time fallback
 * Priority: window._env_ (runtime) > process.env (build-time) > error
 */
export const getEnvVar = (configKey) => {
  const config = ENV_CONFIG[configKey];
  if (!config) {
    throw new Error(`Unknown environment config key: ${configKey}`);
  }

  // Runtime injection (containers) - highest priority
  if (typeof window !== "undefined" && window._env_ && window._env_[config.runtimeKey]) {
    const value = window._env_[config.runtimeKey];
    if (value && value !== `$${config.buildTimeKey}`) {
      // Check it's not an unprocessed template
      return value;
    }
  }

  // Build-time environment (development) - second priority
  if (process.env[config.buildTimeKey]) {
    return process.env[config.buildTimeKey];
  }

  // Fail fast - no unsafe defaults
  throw new Error(
    `${config.description} not configured. ` +
      `Set ${config.buildTimeKey} environment variable or configure runtime injection.`,
  );
};

/**
 * Validate all required environment variables are available
 * Called at application startup
 */
export const validateEnvironmentVariables = () => {
  const missingVars = [];
  const runtimeVars = [];
  const buildTimeVars = [];

  for (const [configKey, config] of Object.entries(ENV_CONFIG)) {
    try {
      const value = getEnvVar(configKey);

      // Track source of each variable for logging
      if (
        typeof window !== "undefined" &&
        window._env_?.[config.runtimeKey] &&
        window._env_[config.runtimeKey] !== `$${config.buildTimeKey}`
      ) {
        runtimeVars.push(`${configKey}=${value}`);
      } else {
        buildTimeVars.push(`${configKey}=${value}`);
      }
    } catch (error) {
      missingVars.push({
        key: configKey,
        buildTimeKey: config.buildTimeKey,
        description: config.description,
        error: error.message,
      });
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = [
      "❌ Missing required environment variables:",
      ...missingVars.map((v) => `  - ${v.description} (${v.buildTimeKey})`),
      "",
      "For development: Set variables in .env file",
      "For containers: Ensure runtime environment injection is configured",
    ].join("\n");

    console.error(errorMessage);
    throw new Error(
      `Missing required environment variables: ${missingVars.map((v) => v.key).join(", ")}`,
    );
  }

  // Log successful configuration in development
  if (process.env.NODE_ENV === "development") {
    console.log("✅ Environment configuration loaded successfully");

    if (runtimeVars.length > 0) {
      console.log("📦 Runtime variables (container):", runtimeVars);
    }
    if (buildTimeVars.length > 0) {
      console.log("🔧 Build-time variables (development):", buildTimeVars);
    }
  }
};

// Convenient getters for each environment variable
export const getKeycloakUrl = () => getEnvVar("KEYCLOAK_URL");
export const getKeycloakRealm = () => getEnvVar("KEYCLOAK_REALM");
export const getKeycloakClientId = () => getEnvVar("KEYCLOAK_CLIENT_ID");
export const getApiUrl = () => getEnvVar("API_URL");

// Legacy compatibility - deprecated
export const getBackendUrl = () => {
  console.warn("getBackendUrl() is deprecated. Use getApiUrl() instead.");
  return getApiUrl();
};

// Legacy compatibility - will be removed after migration
export const getRequiredEnvVar = (name) => {
  console.warn(
    `getRequiredEnvVar('${name}') is deprecated. Use specific getters like getBackendUrl()`,
  );

  // Map old usage to new system
  const mapping = {
    REACT_APP_KEYCLOAK_URL: "KEYCLOAK_URL",
    REACT_APP_KEYCLOAK_REALM: "KEYCLOAK_REALM",
    REACT_APP_KEYCLOAK_CLIENT_ID: "KEYCLOAK_CLIENT_ID",
    REACT_APP_API_URL: "API_URL",
    REACT_APP_BACKEND_URL: "API_URL", // Legacy: redirect to consolidated API_URL
  };

  const configKey = mapping[name];
  if (configKey) {
    return getEnvVar(configKey);
  }

  throw new Error(`Legacy environment variable ${name} not supported`);
};
