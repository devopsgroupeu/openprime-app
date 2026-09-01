// Runtime environment injection for containerized deployments
// This file is processed at container start with envsubst or similar tools
//
// Container environment variables are injected as template variables
// Example: docker run -e REACT_APP_API_URL=https://api.yourdomain.com/api ...
//
// Template variables (like $REACT_APP_API_URL) will be replaced with actual values
// during container startup using tools like envsubst

window._env_ = {
  // Keycloak Authentication Configuration
  KEYCLOAK_URL: "$REACT_APP_KEYCLOAK_URL",
  KEYCLOAK_REALM: "$REACT_APP_KEYCLOAK_REALM",
  KEYCLOAK_CLIENT_ID: "$REACT_APP_KEYCLOAK_CLIENT_ID",

  // Backend API Configuration
  API_URL: "$REACT_APP_API_URL",

  // Feature flags. Unset or unsubstituted means off — see getEnvFlag().
  // USE_RUNTIME_CATALOG makes the wizard build itself from GET /api/catalog
  // (extracted from the templates repo) instead of the static service config.
  USE_RUNTIME_CATALOG: "$REACT_APP_USE_RUNTIME_CATALOG",
};

// Development debugging - shows which variables are runtime vs build-time
if (window.location.hostname === "localhost") {
  console.log(
    "🐛 Runtime environment variables (unprocessed templates will show as $VAR_NAME):",
    window._env_,
  );
}
