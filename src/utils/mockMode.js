// Single source of truth for "mock mode" — lets the frontend run/test
// without a real backend, DB, or Keycloak. Enabled via VITE_MOCK=true.
export const isMockMode = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_MOCK === "true") {
      return true;
    }
  } catch {
    // import.meta not available (e.g. some test envs)
  }
  return typeof process !== "undefined" && process.env?.VITE_MOCK === "true";
};
