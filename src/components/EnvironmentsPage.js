// src/components/EnvironmentsPage.js
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Navigation from './Navigation';
import EnvironmentCard from './EnvironmentCard';
import NewEnvironmentModal from './modals/NewEnvironmentModal';
import HelmValuesModal from './modals/HelmValuesModal';
import { createEmptyEnvironment } from '../config/environmentsConfig';

const EnvironmentsPage = ({ setCurrentPage, currentPage, environments, onCreateEnvironment }) => {
  const [showNewEnvModal, setShowNewEnvModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [showValuesEditor, setShowValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState('');
  const [newEnv, setNewEnv] = useState(createEmptyEnvironment());
  const [expandedServices, setExpandedServices] = useState({});

  const handleCreateEnvironment = () => {
    if (newEnv.name) {
      onCreateEnvironment(newEnv);
      setShowNewEnvModal(false);
      setNewEnv(createEmptyEnvironment());
      setExpandedServices({});
    }
  };

  const handleSaveHelmValues = () => {
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        eks: {
          ...newEnv.services.eks,
          helmCharts: {
            ...newEnv.services.eks.helmCharts,
            [showValuesEditor]: { 
              ...newEnv.services.eks.helmCharts[showValuesEditor], 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Environments</h1>
          <button 
            onClick={() => setShowNewEnvModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center"
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
              onEdit={setEditingEnv}
            />
          ))}
        </div>
      </div>

      {showNewEnvModal && (
        <NewEnvironmentModal
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onClose={() => {
            setShowNewEnvModal(false);
            setExpandedServices({});
          }}
          onCreate={handleCreateEnvironment}
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