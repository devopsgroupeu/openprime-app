// src/App.js
import React, { useState } from 'react';
import HomePage from './components/HomePage';
import EnvironmentsPage from './components/EnvironmentsPage';
import SettingsPage from './components/SettingsPage';
import { initialEnvironments, createEmptyEnvironment } from './config/environmentsConfig';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [environments, setEnvironments] = useState(initialEnvironments);

  const handleCreateEnvironment = (newEnv) => {
    const newEnvironment = {
      ...newEnv,
      id: environments.length + 1,
      status: 'pending'
    };
    setEnvironments([...environments, newEnvironment]);
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
          />
        );
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} currentPage={currentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} currentPage={currentPage} />;
    }
  };

  return <>{renderPage()}</>;
}