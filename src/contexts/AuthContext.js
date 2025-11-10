import React, { createContext, useContext, useState, useEffect } from "react";
import keycloak from "../config/keycloak";

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
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: "login-required",
          checkLoginIframe: false,
          pkceMethod: "S256",
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

          keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).catch(() => {
              console.log("Failed to refresh token, redirecting to login");
              logout();
            });
          };
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
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
