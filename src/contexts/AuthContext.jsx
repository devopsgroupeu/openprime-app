import { createContext, useContext, useState, useEffect } from "react";
import keycloak from "../config/keycloak";
import { isMockMode } from "../utils/mockMode";
import { clearAllDrafts } from "../utils/wizardDraft";

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
  // Distinguishes "Keycloak is unreachable" from "you are signed out". Without
  // it the app rendered "Session expired. Redirecting to login..." during an
  // outage — two false statements at once, under a spinner that never resolves.
  const [authError, setAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Mock mode: skip Keycloak entirely, start authenticated as a fake user.
    if (isMockMode()) {
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    // Try the refresh a few times with growing gaps before giving up on the
    // session. Total ~14s, which covers a pod restart or a brief network blip
    // without the user noticing; anything longer is a real outage and logging
    // out is then the honest outcome.
    const refreshWithBackoff = async (attempt = 0) => {
      const delays = [1000, 3000, 10000];
      try {
        await keycloak.updateToken(30);
        console.log("Token refreshed successfully");
      } catch {
        if (attempt < delays.length) {
          console.warn(
            `Token refresh failed, retrying in ${delays[attempt]}ms (attempt ${attempt + 1}/${delays.length})`,
          );
          setTimeout(() => refreshWithBackoff(attempt + 1), delays[attempt]);
          return;
        }
        console.error("Token refresh failed after retries, logging out");
        logout();
      }
    };

    const initKeycloak = async () => {
      try {
        // Set up event handlers before init
        keycloak.onTokenExpired = () => {
          console.log("Token expired, attempting to update...");
          // A single failed refresh used to log the user out immediately, so one
          // dropped request or a few seconds of Keycloak unavailability ended
          // the session and discarded whatever was on screen. Retry first.
          refreshWithBackoff();
        };

        keycloak.onAuthLogout = () => {
          console.log("Keycloak auth logout triggered");
          // Also fires for logouts this tab did not initiate — another tab, an
          // SSO single-logout, an expired session. Clearing only in logout()
          // would leave the draft behind in exactly those cases.
          clearAllDrafts();
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
          setAuthError(null);
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
        // Swallowing this is what produced the false "Session expired" screen:
        // the app could not tell an outage from a signed-out user.
        console.error("Keycloak initialization failed:", error);
        setAuthError(error instanceof Error ? error : new Error(String(error)));
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
  }, [retryCount]);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    // Before handing the browser to Keycloak: a wizard draft is per-user state
    // and must not outlive the session on a shared machine.
    clearAllDrafts();
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

  /** Re-run Keycloak initialisation — backs the Retry button on the outage screen. */
  const retryAuth = () => {
    setAuthError(null);
    setIsLoading(true);
    setRetryCount((n) => n + 1);
  };

  const value = {
    isAuthenticated,
    isLoading,
    authError,
    retryAuth,
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
