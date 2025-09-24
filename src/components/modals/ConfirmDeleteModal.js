import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ConfirmDeleteModal = ({ environment, onClose, onConfirm, isOpen, title, message }) => {
  const { isDark } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md mx-4 rounded-xl border shadow-xl transition-colors ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-600">
          <h2 className={`text-xl font-bold flex items-center transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            {title || 'Delete Environment'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className={`mb-4 transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {message || `Are you sure you want to delete the environment "${environment?.name}"?`}
          </p>
          <p className={`mb-6 text-sm transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            This action cannot be undone. All configuration for this environment will be permanently removed.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
