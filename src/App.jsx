// src/App.js
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import EnvironmentsPage from "./components/EnvironmentsPage";
import EnvironmentDetailPage from "./components/EnvironmentDetailPage";
import SettingsPage from "./components/SettingsPage";
import WizardPage from "./components/WizardPage";
import AppLayout from "./components/layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import authService from "./services/authService";
import { useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CatalogProvider } from "./contexts/CatalogContext";
import { FullScreenState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

function AppContent() {
  const { isAuthenticated, isLoading, authError, retryAuth } = useAuth();
  const [environments, setEnvironments] = useState([]);
  // True until the first load ends, so the list never flashes its empty state.
  const [environmentsLoading, setEnvironmentsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadEnvironments();
    }
  }, [isAuthenticated, isLoading]);

  const loadEnvironments = async () => {
    try {
      setEnvironmentsLoading(true);
      setLoadError(null);
      const userEnvironments = await authService.get("/environments");
      setEnvironments(userEnvironments);
    } catch (error) {
      console.error("Failed to load environments:", error);
      setLoadError(error.message || "Failed to load environments");
      setEnvironments([]);
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
    return <FullScreenState logo loading title="Signing you in..." />;
  }

  // An unreachable Keycloak is not an expired session. Saying so, with a way
  // out, beats a spinner that will never resolve.
  if (authError) {
    return (
      <FullScreenState
        logo
        title="Couldn't reach the sign-in service"
        description="Your account and environments are unaffected. This is a connection problem, not a sign-out."
        primary={
          <Button size="lg" onClick={retryAuth}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!isAuthenticated) {
    return <FullScreenState logo loading title="Redirecting to sign in..." />;
  }

  return (
    <ToastProvider>
      <CatalogProvider
        fallback={
          <FullScreenState
            logo
            loading
            title="Loading the service catalog..."
          />
        }
      >
        {/* Every route has tooltips, including the wizard outside the shell. */}
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout environments={environments} />}>
                <Route
                  path="/"
                  element={<Navigate to="/environments" replace />}
                />
                <Route
                  path="/environments"
                  element={
                    <EnvironmentsPage
                      environments={environments}
                      loading={environmentsLoading}
                      loadError={loadError}
                      onRetry={loadEnvironments}
                      onDelete={handleDeleteEnvironment}
                    />
                  }
                />
                <Route
                  path="/environments/:id"
                  element={
                    <EnvironmentDetailPage onDelete={handleDeleteEnvironment} />
                  }
                />
                <Route
                  path="/settings"
                  element={<Navigate to="/settings/account" replace />}
                />
                <Route path="/settings/:tab" element={<SettingsPage />} />
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
          </BrowserRouter>
        </TooltipProvider>
      </CatalogProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* Above the auth gate, so the sign-in screens get the theme too. */}
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
