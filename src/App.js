// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EnvironmentsPage from './components/EnvironmentsPage';
import EnvironmentDetailPage from './components/EnvironmentDetailPage';
import SettingsPage from './components/SettingsPage';
import AuraChatButton from './components/AuraChatButton';
import ErrorBoundary from './components/ErrorBoundary';
import authService from './services/authService';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      loadEnvironments();
    }
  }, [isAuthenticated, isLoading]);

  const loadEnvironments = async () => {
    try {
      setEnvironmentsLoading(true);
      const userEnvironments = await authService.get('/environments');
      setEnvironments(userEnvironments);
    } catch (error) {
      console.error('Failed to load environments:', error);
    } finally {
      setEnvironmentsLoading(false);
    }
  };

  const handleCreateEnvironment = async (newEnv) => {
    try {
      const createdEnvironment = await authService.post('/environments', newEnv);
      setEnvironments([createdEnvironment, ...environments]);
      return createdEnvironment;
    } catch (error) {
      console.error('Failed to create environment:', error);
      throw error;
    }
  };

  const handleDeleteEnvironment = async (envId) => {
    try {
      await authService.delete(`/environments/${envId}`);
      setEnvironments(environments.filter(env => env.id !== envId));
    } catch (error) {
      console.error('Failed to delete environment:', error);
      throw error;
    }
  };

  const handleUpdateEnvironment = async (updatedEnv) => {
    try {
      const updated = await authService.put(`/environments/${updatedEnv.id}`, updatedEnv);
      setEnvironments(environments.map(env =>
        env.id === updated.id ? updated : env
      ));
      return updated;
    } catch (error) {
      console.error('Failed to update environment:', error);
      throw error;
    }
  };


  if (isLoading || environmentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading application...</p>
        </div>
      </div>
    );
  }


  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/environments" replace />} />
            <Route
              path="/environments"
              element={
                <EnvironmentsPage
                  environments={environments}
                  onCreateEnvironment={handleCreateEnvironment}
                  onDeleteEnvironment={handleDeleteEnvironment}
                  onUpdateEnvironment={handleUpdateEnvironment}
                />
              }
            />
            <Route
              path="/environments/:id"
              element={
                <EnvironmentDetailPage
                  onEdit={handleUpdateEnvironment}
                  onDelete={handleDeleteEnvironment}
                />
              }
            />
            <Route
              path="/settings"
              element={<SettingsPage />}
            />
          </Routes>
          <AuraChatButton />
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
