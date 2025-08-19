// src/components/EnvironmentsPage.js
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Navigation from './Navigation';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentWizard from './modals/EnvironmentWizard';
import HelmValuesModal from './modals/HelmValuesModal';
import { createEmptyEnvironment } from '../config/environmentsConfig';
import { useTheme } from '../contexts/ThemeContext';

const EnvironmentsPage = ({ setCurrentPage, currentPage, environments, onCreateEnvironment, onDeleteEnvironment, onUpdateEnvironment }) => {
  const { isDark } = useTheme();
  const [showNewEnvModal, setShowNewEnvModal] = useState(false);
  const [showValuesEditor, setShowValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState('');
  const [newEnv, setNewEnv] = useState(createEmptyEnvironment('aws'));
  const [expandedServices, setExpandedServices] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const convertToYaml = (obj, indent = 0) => {
    const spaces = ' '.repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${spaces}${key}:`);
        lines.push(convertToYaml(value, indent + 2));
      } else if (Array.isArray(value)) {
        if (value.length === 0) continue;
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          if (typeof item === 'object') {
            lines.push(`${spaces}  -`);
            lines.push(convertToYaml(item, indent + 4));
          } else {
            lines.push(`${spaces}  - ${item}`);
          }
        }
      } else {
        const formattedValue = typeof value === 'string' ? `"${value}"` : value;
        lines.push(`${spaces}${key}: ${formattedValue}`);
      }
    }

    return lines.join('\n');
  };

  const filterEnabledServices = (services) => {
    const filtered = {};

    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      if (serviceConfig.enabled) {
        // Create a copy without the 'enabled' field
        const { enabled, ...configWithoutEnabled } = serviceConfig;
        filtered[serviceName] = configWithoutEnabled;
      }
    }

    return filtered;
  };

  const handleCreateEnvironment = async () => {
    if (newEnv.name) {
      const enabledServices = filterEnabledServices(newEnv.services);

      if (Object.keys(enabledServices).length > 0) {
        const environmentConfig = {
          name: newEnv.name,
          type: newEnv.type,
          region: newEnv.region,
          services: enabledServices
        };

        const yamlOutput = convertToYaml(environmentConfig);
        console.log('Environment Configuration (YAML):\n' + yamlOutput);

        // Send POST request to backend
        try {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080/api';
          const response = await fetch(`${backendUrl}/environments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(environmentConfig)
          });

          if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
          }

          console.log('Environment configuration sent to backend successfully');
        } catch (error) {
          console.error('Failed to send environment configuration to backend:', error);
          alert(`Failed to send configuration to backend: ${error.message}`);
        }
      } else {
        console.log('No services enabled in this environment');
      }

      if (isEditMode) {
        onUpdateEnvironment(newEnv);
      } else {
        onCreateEnvironment(newEnv);
      }
      setShowNewEnvModal(false);
      setNewEnv(createEmptyEnvironment('aws'));
      setExpandedServices({});
      setIsEditMode(false);
    } else {
      alert('Please enter an environment name');
    }
  };

  const handleEditEnvironment = (environment) => {
    setNewEnv({ ...environment });
    setIsEditMode(true);
    setShowNewEnvModal(true);
  };

  const handleSaveHelmValues = () => {
    const kubernetesService = newEnv.type === 'azure' ? 'aks' : 'eks';
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [kubernetesService]: {
          ...newEnv.services[kubernetesService],
          helmCharts: {
            ...newEnv.services[kubernetesService].helmCharts,
            [showValuesEditor]: {
              ...newEnv.services[kubernetesService].helmCharts[showValuesEditor],
              customValues: true
            }
          }
        }
      }
    });
    setShowValuesEditor(null);
    setEditingHelmValues('');
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-gray-50 via-white to-teal-50'
    }`}>
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Environments</h1>
          <button
            onClick={() => setShowNewEnvModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Environment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {environments.map(env => (
            <EnvironmentCard
              key={env.id}
              environment={env}
              onEdit={handleEditEnvironment}
              onDelete={onDeleteEnvironment}
            />
          ))}
        </div>
      </div>

      {showNewEnvModal && (
        <EnvironmentWizard
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onClose={() => {
            setShowNewEnvModal(false);
            setExpandedServices({});
            setIsEditMode(false);
          }}
          onCreate={handleCreateEnvironment}
          isEditMode={isEditMode}
          onEditHelmValues={(chart, values) => {
            setShowValuesEditor(chart);
            setEditingHelmValues(values);
          }}
        />
      )}

      {showValuesEditor && (
        <HelmValuesModal
          chartName={showValuesEditor}
          values={editingHelmValues}
          onChange={setEditingHelmValues}
          onClose={() => setShowValuesEditor(null)}
          onSave={handleSaveHelmValues}
        />
      )}
    </div>
  );
};

export default EnvironmentsPage;
