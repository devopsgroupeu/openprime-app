import { createContext, useContext, useState, useEffect } from "react";
import keycloak from "../config/keycloak";
import { isMockMode } from "../utils/mockMode";

// Fake authenticated user for mock mode (no Keycloak).
const MOCK_USER = {
  id: "mock-user-1",
  username: "mockuser",
  email: "mock@openprime.dev",
  firstName: "Mock",
  lastName: "User",
  fullName: "Mock User",
  roles: ["user"],
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [keycloakInstance, setKeycloakInstance] = useState(null);

  useEffect(() => {
    // Mock mode: skip Keycloak entirely, start authenticated as a fake user.
    if (isMockMode()) {
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    const initKeycloak = async () => {
      try {
        // Set up event handlers before init
        keycloak.onTokenExpired = () => {
          console.log("Token expired, attempting to update...");
          keycloak
            .updateToken(30)
            .then((refreshed) => {
              if (refreshed) {
                console.log("Token refreshed successfully");
              } else {
                console.warn(
                  "Token not refreshed, user may need to log in again",
                );
              }
            })
            .catch(() => {
              console.error("Failed to refresh token, logging out...");
              logout();
            });
        };

        keycloak.onAuthLogout = () => {
          console.log("Keycloak auth logout triggered");
          setIsAuthenticated(false);
          setUser(null);
        };

        keycloak.onAuthError = (error) => {
          console.error("Keycloak auth error:", error);
        };

        const authenticated = await keycloak.init({
          onLoad: "login-required",
          checkLoginIframe: false,
          pkceMethod: "S256",
          silentCheckSsoRedirectUri:
            window.location.origin + "/silent-check-sso.html",
        });

        if (authenticated) {
          setIsAuthenticated(true);
          setUser({
            id: keycloak.subject,
            username: keycloak.tokenParsed?.preferred_username,
            email: keycloak.tokenParsed?.email,
            firstName: keycloak.tokenParsed?.given_name,
            lastName: keycloak.tokenParsed?.family_name,
            fullName: keycloak.tokenParsed?.name,
            roles: keycloak.tokenParsed?.realm_access?.roles || [],
          });
          setKeycloakInstance(keycloak);
        } else {
          console.warn("User is not authenticated after init");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();

    // Add visibility change listener to refresh token when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && keycloak.authenticated) {
        keycloak
          .updateToken(30)
          .then((refreshed) => {
            if (refreshed) {
              console.log("Token refreshed on visibility change");
            }
          })
          .catch(() => {
            console.error(
              "Failed to refresh token on visibility change, logging out...",
            );
            logout();
          });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
    setIsAuthenticated(false);
    setUser(null);
  };

  const getToken = () => {
    return keycloak.token;
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    keycloakInstance,
    login,
    logout,
    getToken,
    hasRole,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
