// src/components/modals/wizard/BasicConfigStep.js
import React from 'react';
import { Cloud, MapPin, Type } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { PROVIDERS, createEmptyEnvironment } from '../../../config/environmentsConfig';

const BasicConfigStep = ({ newEnv, setNewEnv, validationErrors = [] }) => {
  const { isDark } = useTheme();

  const getFieldError = (fieldName) => {
    return validationErrors.find(error => error.field === fieldName);
  };

  const handleProviderChange = (providerType) => {
    const emptyEnv = createEmptyEnvironment(providerType);
    setNewEnv({
      ...emptyEnv,
      name: newEnv.name // Preserve the environment name
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 ${
          isDark
            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
            : 'bg-teal-500/10 text-teal-700 border border-teal-500/30'
        }`}>
          <Cloud className="w-4 h-4 mr-2" />
          Basic Configuration
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Let's start with the basics
        </h3>
        <p className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Choose your environment name, cloud provider, and deployment region
        </p>
      </div>

      {/* Environment Name */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <Type className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Environment Name
          </label>
        </div>
        <input
          type="text"
          className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 text-lg ${
            getFieldError('name')
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : isDark
              ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
              : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
          }`}
          placeholder="e.g., Production, Staging, Development"
          value={newEnv.name}
          onChange={(e) => setNewEnv({...newEnv, name: e.target.value})}
        />
        {getFieldError('name') ? (
          <p className="text-red-500 text-xs mt-2">
            {getFieldError('name').message}
          </p>
        ) : (
          <p className={`text-xs mt-2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Choose a descriptive name that identifies the purpose of this environment
          </p>
        )}
      </div>

      {/* Cloud Provider */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <Cloud className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Cloud Provider
          </label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PROVIDERS).map(([key, provider]) => (
            <button
              key={key}
              onClick={() => handleProviderChange(key)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                newEnv.type === key
                  ? isDark
                    ? 'border-teal-500 bg-teal-500/20 text-white'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : isDark
                  ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  newEnv.type === key
                    ? 'bg-teal-500 text-white'
                    : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium">{provider.name}</div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {key === 'aws' ? 'Amazon Web Services' :
                   key === 'azure' ? 'Microsoft Azure' :
                   key === 'gcp' ? 'Google Cloud Platform' :
                   'Self-managed'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Region Selection */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Deployment Region
          </label>
        </div>

        {newEnv.type && PROVIDERS[newEnv.type] ? (
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 text-lg ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
              value={newEnv.region}
              onChange={(e) => setNewEnv({...newEnv, region: e.target.value})}
            >
              {PROVIDERS[newEnv.type].regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Choose the region closest to your users for optimal performance
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg border-2 border-dashed text-center ${
            isDark
              ? 'border-gray-600 bg-gray-700/30 text-gray-400'
              : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}>
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a cloud provider first</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {newEnv.name && newEnv.type && newEnv.region && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">
              Ready to create "{newEnv.name}" on {PROVIDERS[newEnv.type]?.name} in {PROVIDERS[newEnv.type]?.regions.find(r => r.value === newEnv.region)?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicConfigStep;
