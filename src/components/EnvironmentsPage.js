// src/components/EnvironmentsPage.js
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Navigation from './Navigation';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentWizard from './modals/EnvironmentWizard';
import HelmValuesModal from './modals/HelmValuesModal';
import { createEmptyEnvironment } from '../config/environmentsConfig';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

const EnvironmentsPage = ({ setCurrentPage, currentPage, environments, onCreateEnvironment, onDeleteEnvironment, onUpdateEnvironment, onViewEnvironment, selectedEnvironment, onClearSelectedEnvironment }) => {
  const { isDark } = useTheme();
  const { success, error } = useToast();
  const [showNewEnvModal, setShowNewEnvModal] = useState(false);
  const [showValuesEditor, setShowValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState('');
  const [newEnv, setNewEnv] = useState(createEmptyEnvironment('aws'));
  const [expandedServices, setExpandedServices] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we should automatically open the edit modal for a selected environment
  React.useEffect(() => {
    if (selectedEnvironment && !showNewEnvModal) {
      setNewEnv({ ...selectedEnvironment });
      setIsEditMode(true);
      setShowNewEnvModal(true);
    }
  }, [selectedEnvironment, showNewEnvModal]);

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
    if (!newEnv.name) {
      error('Please enter an environment name', {
        title: 'Validation Error',
        duration: 5000
      });
      return;
    }

    setIsLoading(true);

    try {
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
          const backendUrl =
            (typeof window !== 'undefined' && window._env_ && window._env_.BACKEND_URL) ||
            process.env.REACT_APP_BACKEND_URL ||
            'http://localhost:8080/api';

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
          success('Configuration sent to backend successfully', {
            title: 'Backend Sync',
            duration: 3000
          });
        } catch (backendError) {
          console.error('Failed to send environment configuration to backend:', backendError);
          error(`Failed to send configuration to backend: ${backendError.message}`, {
            title: 'Backend Error',
            duration: 7000
          });
        }
      } else {
        console.log('No services enabled in this environment');
      }

      // Update the environment list
      if (isEditMode) {
        onUpdateEnvironment(newEnv);
        success(`Environment "${newEnv.name}" updated successfully`, {
          title: 'Environment Updated',
          duration: 4000
        });
      } else {
        onCreateEnvironment(newEnv);
        success(`Environment "${newEnv.name}" created successfully`, {
          title: 'Environment Created',
          duration: 4000
        });
      }

      // Reset form state
      setShowNewEnvModal(false);
      setNewEnv(createEmptyEnvironment('aws'));
      setExpandedServices({});
      setIsEditMode(false);
    } catch (err) {
      error(`Failed to ${isEditMode ? 'update' : 'create'} environment: ${err.message}`, {
        title: 'Error',
        duration: 7000
      });
    } finally {
      setIsLoading(false);
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
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900'
        : 'bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50'
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
              onClick={onViewEnvironment}
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
            onClearSelectedEnvironment?.(); // Clear selected environment when closing modal
          }}
          onCreate={handleCreateEnvironment}
          isEditMode={isEditMode}
          isLoading={isLoading}
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
