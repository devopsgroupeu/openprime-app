// src/config/keycloakConfig.js
import Keycloak from "keycloak-js";

// Configure these values based on your Keycloak setup
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080", // Your Keycloak server URL
  realm: process.env.REACT_APP_KEYCLOAK_REALM || "your-realm-name", // Your realm name
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || "your-client-id", // Your client ID
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;

// Helper functions for authentication
export const initKeycloak = () => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({
        onLoad: "login-required", // Options: 'login-required', 'check-sso'
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        if (authenticated) {
          console.log("User authenticated successfully");
          // Set up token refresh
          setupTokenRefresh();
        } else {
          console.log("User not authenticated");
        }
        resolve(authenticated);
      })
      .catch((error) => {
        console.error("Keycloak initialization failed", error);
        reject(error);
      });
  });
};

// Helper function to set up token refresh
const setupTokenRefresh = () => {
  setInterval(() => {
    refreshTokenIfNeeded();
  }, 60000); // Check every minute
};

const refreshTokenIfNeeded = () => {
  keycloak
    .updateToken(70)
    .then((refreshed) => {
      if (refreshed) {
        console.log("Token refreshed");
      }
    })
    .catch(() => {
      console.log("Failed to refresh token");
    });
};

export const getToken = () => keycloak.token;
export const getRefreshToken = () => keycloak.refreshToken;
export const getUserInfo = () => keycloak.tokenParsed;
export const logout = () => keycloak.logout();
export const login = () => keycloak.login();

// Axios interceptor helper for adding auth headers
export const setupAxiosInterceptors = (axios) => {
  axios.interceptors.request.use(
    (config) => {
      if (keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        keycloak.login();
      }
      return Promise.reject(error);
    }
  );
};
