// src/components/modals/HelmValuesModal.js
import React from 'react';

const HelmValuesModal = ({ chartName, values, onChange, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-8 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-white mb-6">
          Edit {chartName} Values
        </h2>

        <div className="bg-gray-900 rounded-lg p-4">
          <textarea
            className="w-full h-64 bg-transparent text-green-400 font-mono text-sm resize-none focus:outline-none"
            value={values}
            onChange={(e) => onChange(e.target.value)}
            spellCheck="false"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Save Values
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelmValuesModal;
