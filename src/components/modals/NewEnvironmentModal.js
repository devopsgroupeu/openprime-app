// src/components/modals/NewEnvironmentModal.js
import React from 'react';
import { PROVIDERS, createEmptyEnvironment } from '../../config/environmentsConfig';
import DynamicServicesGrid from '../DynamicServicesGrid';
import { useTheme } from '../../contexts/ThemeContext';

const NewEnvironmentModal = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onClose,
  onCreate,
  onEditHelmValues,
  isEditMode = false
}) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {isEditMode ? 'Edit Environment' : 'Create New Environment'}
        </h2>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>Environment Name</label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                placeholder="e.g., Staging"
                value={newEnv.name}
                onChange={(e) => setNewEnv({...newEnv, name: e.target.value})}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>Cloud Provider</label>
              <select
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                value={newEnv.type}
                onChange={(e) => {
                  const providerType = e.target.value;
                  const emptyEnv = createEmptyEnvironment(providerType);
                  setNewEnv({
                    ...emptyEnv,
                    name: newEnv.name // Preserve the environment name
                  });
                }}
              >
                {Object.entries(PROVIDERS).map(([key, provider]) => (
                  <option key={key} value={key}>{provider.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>Region</label>
              <select
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                value={newEnv.region}
                onChange={(e) => setNewEnv({...newEnv, region: e.target.value})}
              >
                {PROVIDERS[newEnv.type]?.regions.map((region) => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cloud Services */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {PROVIDERS[newEnv.type]?.name || 'Cloud'} Services
            </label>
            <DynamicServicesGrid
              newEnv={newEnv}
              setNewEnv={setNewEnv}
              expandedServices={expandedServices}
              setExpandedServices={setExpandedServices}
              onEditHelmValues={onEditHelmValues}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg transition-all ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
          >
            {isEditMode ? 'Update Environment' : 'Create Environment'}
          </button>
        </div>
      </div>
    </div>
  );
};





export default NewEnvironmentModal;
