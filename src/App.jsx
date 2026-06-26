// src/App.js
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";
import EnvironmentsPage from "./components/EnvironmentsPage";
import EnvironmentDetailPage from "./components/EnvironmentDetailPage";
import SettingsPage from "./components/SettingsPage";
import WizardPage from "./components/WizardPage";
import AppLayout from "./components/layout/AppLayout";
import AuraChatButton from "./components/AuraChatButton";
import ErrorBoundary from "./components/ErrorBoundary";
import authService from "./services/authService";
import { useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";

// The wizard has its own inline Aura assistant, so hide the floating one there.
function FloatingAura() {
  const { pathname } = useLocation();
  const onWizard = /^\/environments\/(create|[^/]+\/edit)\/?$/.test(pathname);
  return onWizard ? null : <AuraChatButton />;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadEnvironments();
    }
  }, [isAuthenticated, isLoading]);

  const loadEnvironments = async () => {
    try {
      setEnvironmentsLoading(true);
      const userEnvironments = await authService.get("/environments");
      setEnvironments(userEnvironments);
    } catch (error) {
      console.error("Failed to load environments:", error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const handleCreateEnvironment = async (newEnv) => {
    try {
      const createdEnvironment = await authService.post(
        "/environments",
        newEnv,
      );
      setEnvironments([createdEnvironment, ...environments]);
      return createdEnvironment;
    } catch (error) {
      console.error("Failed to create environment:", error);
      throw error;
    }
  };

  const handleDeleteEnvironment = async (envId) => {
    try {
      await authService.delete(`/environments/${envId}`);
      setEnvironments(environments.filter((env) => env.id !== envId));
    } catch (error) {
      console.error("Failed to delete environment:", error);
      throw error;
    }
  };

  const handleUpdateEnvironment = async (updatedEnv) => {
    try {
      const updated = await authService.put(
        `/environments/${updatedEnv.id}`,
        updatedEnv,
      );
      setEnvironments(
        environments.map((env) => (env.id === updated.id ? updated : env)),
      );
      return updated;
    } catch (error) {
      console.error("Failed to update environment:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-openprime-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-lg font-poppins">
            Initializing OpenPrime...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-openprime-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-lg font-poppins">
            Session expired. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (environmentsLoading) {
    return (
      <div className="min-h-screen bg-openprime-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-lg font-poppins">
            Loading environments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={<Navigate to="/environments" replace />}
              />
              <Route
                path="/environments"
                element={<EnvironmentsPage environments={environments} />}
              />
              <Route
                path="/environments/:id"
                element={
                  <EnvironmentDetailPage onDelete={handleDeleteEnvironment} />
                }
              />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route
              path="/environments/create"
              element={
                <WizardPage
                  onCreateEnvironment={handleCreateEnvironment}
                  onUpdateEnvironment={handleUpdateEnvironment}
                />
              }
            />
            <Route
              path="/environments/:id/edit"
              element={
                <WizardPage
                  onCreateEnvironment={handleCreateEnvironment}
                  onUpdateEnvironment={handleUpdateEnvironment}
                />
              }
            />
          </Routes>
          <FloatingAura />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
