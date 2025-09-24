import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Cloud, Server, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const EnvironmentHeader = ({
  environment,
  providerConfig,
  onEdit,
  onDelete
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const getProviderIcon = (type) => {
    const iconColors = {
      'aws': 'text-orange-400',
      'azure': 'text-blue-400',
      'gcp': 'text-green-400',
      'onpremise': 'text-gray-400'
    };

    const colorClass = iconColors[type] || 'text-gray-400';
    const IconComponent = type === 'onpremise' ? Server : Cloud;

    return <IconComponent className={`w-6 h-6 ${colorClass}`} />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'running': 'text-green-400 bg-green-400/10 border-green-400/20',
      'pending': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      'stopped': 'text-red-400 bg-red-400/10 border-red-400/20',
      'error': 'text-red-400 bg-red-400/10 border-red-400/20'
    };
    return colors[status] || colors['pending'];
  };

  return (
    <div className={`backdrop-blur-md border-b transition-colors ${
      isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/environments')}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              {getProviderIcon(environment.provider)}
              <div>
                <h1 className={`text-3xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {environment.name}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {providerConfig?.name || environment.provider}
                  </span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {environment.region}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${
                    getStatusColor(environment.status)
                  }`}>
                    {environment.status.charAt(0).toUpperCase() + environment.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(environment)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isDark
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={onDelete}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isDark
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentHeader;
