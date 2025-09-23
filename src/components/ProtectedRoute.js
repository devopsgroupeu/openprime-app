// src/components/ProtectedRoute.js
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext";
import AuthLoadingSpinner from "./AuthLoadingSpinner";

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user, hasRole, hasAnyRole } = useAuth();

  if (loading) {
    return <AuthLoadingSpinner />;
  }

  if (!isAuthenticated) {
    // This shouldn't happen as Keycloak will redirect to login
    // But we'll show a message just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be authenticated to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Insufficient Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have the required role '{requiredRole}' to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Current user: {user?.username}
          </p>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Insufficient Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any of the required roles to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Required roles: {requiredRoles.join(", ")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Current user: {user?.username}</p>
        </div>
      </div>
    );
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
