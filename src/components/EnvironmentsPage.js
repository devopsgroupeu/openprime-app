// src/components/EnvironmentsPage.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, Copy } from 'lucide-react';
import Navigation from './Navigation';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentWizard from './modals/EnvironmentWizard';
import HelmValuesModal from './modals/HelmValuesModal';
import { createEmptyEnvironment } from '../config/environmentsConfig';
import { useToast } from '../contexts/ToastContext';

const EnvironmentsPage = ({ environments, onCreateEnvironment, onDeleteEnvironment, onUpdateEnvironment }) => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [showNewEnvModal, setShowNewEnvModal] = useState(false);
  const [showValuesEditor, setShowValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState('');
  const [newEnv, setNewEnv] = useState(createEmptyEnvironment('aws'));
  const [expandedServices, setExpandedServices] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDeployedUrl, setLastDeployedUrl] = useState(null);

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
      // Send all services (enabled and disabled) to maintain complete configuration
      const environmentConfig = {
        prefix: newEnv.name,
        // name: newEnv.name,
        // provider: newEnv.provider,
        // region: newEnv.region,
        // services: newEnv.services || {} Commented due to Demo mode
      };

      try {
        const deployedUrl = `${newEnv.name}.openprime.io`;
        if (isEditMode) {
          await onUpdateEnvironment(environmentConfig);
          setLastDeployedUrl(deployedUrl);
        } else {
          await onCreateEnvironment(environmentConfig);
          setLastDeployedUrl(deployedUrl);
        }

        success('Environment synced with backend successfully', {
          title: 'Backend Sync',
          duration: 3000
        });
      } catch (backendError) {
        error(`Failed to sync with backend: ${backendError.message}`, {
          title: 'Backend Error',
          duration: 7000
        });
        return;
      }

      // Environment creation/update is handled in the backend success block above
      success(`Environment "${newEnv.name}" ${isEditMode ? 'updated' : 'created'} successfully`, {
        title: `Environment ${isEditMode ? 'Updated' : 'Created'}`,
        duration: 4000
      });

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
    const kubernetesService = newEnv.provider === 'azure' ? 'aks' : 'eks';

    // Ensure the kubernetes service exists
    if (!newEnv.services || !newEnv.services[kubernetesService]) {
      console.warn(`Kubernetes service ${kubernetesService} not found in environment services`);
      setShowValuesEditor(null);
      setEditingHelmValues('');
      return;
    }

    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [kubernetesService]: {
          ...newEnv.services[kubernetesService],
          helmCharts: {
            ...newEnv.services[kubernetesService]?.helmCharts,
            [showValuesEditor]: {
              ...newEnv.services[kubernetesService]?.helmCharts?.[showValuesEditor],
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
    <div className="min-h-screen transition-colors duration-200 bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-8 py-8">
        {lastDeployedUrl && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-emerald-900">App deployed</span>
              <a
                href={lastDeployedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline break-all"
              >
                {lastDeployedUrl}
              </a>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(lastDeployedUrl, '_blank', 'noopener')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                <ExternalLink className="w-4 h-4" />
                Open app
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lastDeployedUrl);
                    success('Link copied to clipboard', { title: 'Copied', duration: 2000 });
                  } catch {
                    error('Could not copy link', { title: 'Clipboard Error', duration: 3000 });
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100"
              >
                <Copy className="w-4 h-4" />
                Copy link
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-sora transition-colors duration-200 text-primary">
            Environments
          </h1>
          <button
            onClick={() => {
              setNewEnv(createEmptyEnvironment('aws'));
              setIsEditMode(false);
              setShowNewEnvModal(true);
            }}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-inverse rounded-lg font-semibold font-poppins transition-all duration-200 flex items-center shadow-elevation-2 hover:shadow-elevation-3 animate-fade-in"
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
              onClick={(env) => navigate(`/environments/${env.id}`)}
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
            setNewEnv(createEmptyEnvironment('aws')); // Reset to empty environment
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
