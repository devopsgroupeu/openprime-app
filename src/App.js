// src/App.js
import React, { useState } from 'react';
import HomePage from './components/HomePage';
import EnvironmentsPage from './components/EnvironmentsPage';
import SettingsPage from './components/SettingsPage';
import { initialEnvironments } from './config/environmentsConfig';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
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
      {renderPage()}
    </ThemeProvider>
  );
}
