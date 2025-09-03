import React, { useState } from 'react';
import { Download, Copy, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

const ConfigurationExport = ({ environment }) => {
  const { isDark } = useTheme();
  const { success } = useToast();
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const generateConfiguration = () => {
    const config = {
      environment: {
        name: environment.name,
        provider: environment.provider,
        region: environment.region,
        status: environment.status
      },
      services: {}
    };

    // Add enabled services to configuration
    Object.entries(environment.services || {}).forEach(([serviceName, serviceConfig]) => {
      if (serviceConfig?.enabled) {
        config.services[serviceName] = { ...serviceConfig };
      }
    });

    return config;
  };

  const downloadConfiguration = () => {
    const config = generateConfiguration();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${environment.name}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
    success('Configuration downloaded successfully');
  };

  const copyToClipboard = () => {
    const config = generateConfiguration();
    const dataStr = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      success('Configuration copied to clipboard');
    });
  };

  const maskSensitiveValue = (key, value) => {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    const isSensitive = sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey)
    );

    if (isSensitive && !showSensitiveData) {
      return '••••••••';
    }
    return value;
  };

  const renderConfigValue = (key, value, level = 0) => {
    const indent = '  '.repeat(level);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={key}>
          <div className={`${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            {indent}"{key}": {'{'}
          </div>
          {Object.entries(value).map(([subKey, subValue]) =>
            renderConfigValue(subKey, subValue, level + 1)
          )}
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {indent}{'}'}
            {level > 0 ? ',' : ''}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <div className={`${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            {indent}"{key}": [
          </div>
          {value.map((item, index) => (
            <div key={index} className={`${isDark ? 'text-green-300' : 'text-green-600'}`}>
              {indent}  "{item}"{index < value.length - 1 ? ',' : ''}
            </div>
          ))}
          <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {indent}],
          </div>
        </div>
      );
    }

    const displayValue = maskSensitiveValue(key, value);
    const valueColor = typeof value === 'string' ?
      (isDark ? 'text-green-300' : 'text-green-600') :
      (isDark ? 'text-orange-300' : 'text-orange-600');

    return (
      <div key={key}>
        <span className={`${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
          {indent}"{key}":
        </span>
        {' '}
        <span className={valueColor}>
          {typeof value === 'string' ? `"${displayValue}"` : displayValue}
        </span>
        <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>,</span>
      </div>
    );
  };

  const config = generateConfiguration();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Configuration Export
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {showSensitiveData ? (
              <>
                <EyeOff className="w-4 h-4 inline mr-1" />
                Hide Sensitive
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 inline mr-1" />
                Show Sensitive
              </>
            )}
          </button>
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDark
                ? 'bg-teal-700 hover:bg-teal-600 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            <Copy className="w-4 h-4 inline mr-1" />
            Copy
          </button>
          <button
            onClick={downloadConfiguration}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDark
                ? 'bg-blue-700 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="w-4 h-4 inline mr-1" />
            Download
          </button>
        </div>
      </div>

      <div className={`p-4 rounded-lg border font-mono text-sm overflow-auto max-h-96 ${
        isDark
          ? 'bg-gray-900 border-gray-700 text-gray-300'
          : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}>
        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {'{'}
        </div>
        {Object.entries(config).map(([key, value]) =>
          renderConfigValue(key, value, 1)
        )}
        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {'}'}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationExport;
