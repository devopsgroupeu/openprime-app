// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  initKeycloak,
  getUserInfo,
  logout as keycloakLogout,
  getToken,
} from "../config/keycloakConfig";

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const authenticated = await initKeycloak();

        if (authenticated) {
          setIsAuthenticated(true);
          const userInfo = getUserInfo();
          setUser({
            id: userInfo?.sub,
            username: userInfo?.preferred_username,
            email: userInfo?.email,
            name: userInfo?.name,
            roles: userInfo?.realm_access?.roles || [],
            ...userInfo,
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Authentication initialization failed:", err);
        setError(err.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    keycloakLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles) => {
    if (!user?.roles) return false;
    return roles.some((role) => user.roles.includes(role));
  };

  const getAuthToken = () => {
    return getToken();
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      loading,
      error,
      logout,
      hasRole,
      hasAnyRole,
      getAuthToken,
    }),
    [isAuthenticated, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
