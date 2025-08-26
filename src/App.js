// src/App.js
import React, { useState } from 'react';
import HomePage from './components/HomePage';
import EnvironmentsPage from './components/EnvironmentsPage';
import EnvironmentDetailPage from './components/EnvironmentDetailPage';
import SettingsPage from './components/SettingsPage';
import AuraChatButton from './components/AuraChatButton';
import ErrorBoundary from './components/ErrorBoundary';
import { initialEnvironments } from './config/environmentsConfig';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [environments, setEnvironments] = useState(initialEnvironments);

  const handleCreateEnvironment = (newEnv) => {
    const newEnvironment = {
      ...newEnv,
      id: Math.max(...environments.map(e => e.id), 0) + 1,
      status: 'pending'
    };
    setEnvironments([...environments, newEnvironment]);
  };

  const handleDeleteEnvironment = (envId) => {
    setEnvironments(environments.filter(env => env.id !== envId));
  };

  const handleUpdateEnvironment = (updatedEnv) => {
    setEnvironments(environments.map(env =>
      env.id === updatedEnv.id ? updatedEnv : env
    ));
    // Update selected environment if it's the one being updated
    if (selectedEnvironment?.id === updatedEnv.id) {
      setSelectedEnvironment(updatedEnv);
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
              // Stay on environment detail page and let it handle the edit modal
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
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          {renderPage()}
          <AuraChatButton />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
