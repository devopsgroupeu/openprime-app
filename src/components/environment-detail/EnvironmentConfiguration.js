import React, { useState } from 'react';
import { Download, Copy, Code, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

const EnvironmentConfiguration = ({ environment }) => {
  const { isDark } = useTheme();
  const { success } = useToast();
  const [format, setFormat] = useState('json');

  const generateConfiguration = () => {
    return {
      name: environment.name,
      provider: environment.provider,
      region: environment.region,
      status: environment.status,
      services: environment.services || {},
      createdAt: environment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const formatAsYAML = (obj, indent = 0) => {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${formatAsYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${formatAsYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    });

    return yaml;
  };

  const getFormattedContent = () => {
    const config = generateConfiguration();

    if (format === 'yaml') {
      return formatAsYAML(config);
    } else {
      return JSON.stringify(config, null, 2);
    }
  };

  const downloadConfiguration = () => {
    const content = getFormattedContent();
    const fileName = `${environment.name}-config.${format}`;
    const mimeType = format === 'yaml' ? 'text/yaml' : 'application/json';

    const dataBlob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    success(`Configuration downloaded as ${fileName}`);
  };

  const copyToClipboard = () => {
    const content = getFormattedContent();
    navigator.clipboard.writeText(content).then(() => {
      success(`${format.toUpperCase()} configuration copied to clipboard`);
    });
  };

  const content = getFormattedContent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Environment Configuration
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === 'json'
                  ? isDark
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-600 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              JSON
            </button>
            <button
              onClick={() => setFormat('yaml')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === 'yaml'
                  ? isDark
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-600 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              YAML
            </button>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Copy className="w-4 h-4 inline mr-2" />
            Copy
          </button>
          <button
            onClick={downloadConfiguration}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>
      </div>

      <div className={`rounded-lg border ${
        isDark
          ? 'bg-gray-900/50 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`px-4 py-3 border-b text-sm font-medium flex items-center justify-between ${
          isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
        }`}>
          <span>{environment.name} - {format.toUpperCase()} Configuration</span>
          <span className="text-xs opacity-75">
            {content.split('\n').length} lines
          </span>
        </div>
        <div className="relative">
          <pre className={`p-4 text-sm font-mono overflow-auto max-h-96 ${
            isDark ? 'text-gray-300' : 'text-gray-800'
          }`}>
            <code>{content}</code>
          </pre>
        </div>
      </div>

      <div className={`p-4 rounded-lg border-l-4 ${
        isDark
          ? 'bg-blue-900/20 border-blue-500/50 text-blue-300'
          : 'bg-blue-50 border-blue-500 text-blue-700'
      }`}>
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Configuration Export</p>
            <p className="text-sm opacity-90">
              This configuration represents the complete state of your environment including all services,
              settings, and metadata. You can use this to backup, version control, or recreate this environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentConfiguration;
