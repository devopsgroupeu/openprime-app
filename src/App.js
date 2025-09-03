// src/App.js
import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
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
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
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
      // Update selected environment if it's the one being updated
      if (selectedEnvironment?.id === updated.id) {
        setSelectedEnvironment(updated);
      }
      return updated;
    } catch (error) {
      console.error('Failed to update environment:', error);
      throw error;
    }
  };

  const handleViewEnvironment = (environment) => {
    setSelectedEnvironment(environment);
    setCurrentPage('environment-detail');
  };

  const handleBackToEnvironments = () => {
    setSelectedEnvironment(null);
    setCurrentPage('environments');
  };

  const handleClearSelectedEnvironment = () => {
    setSelectedEnvironment(null);
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

  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} currentPage={currentPage} />;
      case 'environments':
        return (
          <EnvironmentsPage
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            environments={environments}
            onCreateEnvironment={handleCreateEnvironment}
            onDeleteEnvironment={handleDeleteEnvironment}
            onUpdateEnvironment={handleUpdateEnvironment}
            onViewEnvironment={handleViewEnvironment}
            selectedEnvironment={selectedEnvironment}
            onClearSelectedEnvironment={handleClearSelectedEnvironment}
          />
        );
      case 'environment-detail':
        return (
          <EnvironmentDetailPage
            environment={selectedEnvironment}
            onBack={handleBackToEnvironments}
            onEdit={(env) => {
              setSelectedEnvironment(env);
              setCurrentPage('environments'); // Navigate to environments page to show edit modal              
            }}
            onDelete={handleDeleteEnvironment}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
          />
        );
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} currentPage={currentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} currentPage={currentPage} />;
    }
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        {renderPage()}
        <AuraChatButton />
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
