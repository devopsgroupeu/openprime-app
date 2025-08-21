// src/components/modals/HelmValuesModal.js
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HelmValuesModal = ({ chartName, values, onChange, onClose, onSave }) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl p-8 max-w-4xl w-full ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold mb-6 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Edit {chartName} Values
        </h2>

        <div className={`rounded-lg p-4 ${
          isDark ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <textarea
            className={`w-full h-64 bg-transparent font-mono text-sm resize-none focus:outline-none ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}
            value={values}
            onChange={(e) => onChange(e.target.value)}
            spellCheck="false"
            aria-label={`Edit YAML values for ${chartName}`}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg transition-all ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label="Cancel editing"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            aria-label={`Save ${chartName} configuration`}
          >
            Save Values
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelmValuesModal;
