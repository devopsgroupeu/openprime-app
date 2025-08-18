// src/components/DynamicServiceConfig.js
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getServiceConfig, FIELD_TYPES } from '../config/servicesConfig';
import { useTheme } from '../contexts/ThemeContext';
import DynamicFieldRenderer from './DynamicFieldRenderer';

const DynamicServiceConfig = ({
  serviceName,
  serviceConfig,
  onServiceChange,
  expanded,
  onToggleExpanded
}) => {
  const { isDark } = useTheme();
  const serviceDefinition = getServiceConfig(serviceName);

  if (!serviceDefinition) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    onServiceChange(serviceName, {
      ...serviceConfig,
      [fieldName]: value
    });
  };

  const enabledField = serviceDefinition.fields.enabled;
  const otherFields = Object.entries(serviceDefinition.fields).filter(
    ([fieldName]) => fieldName !== 'enabled'
  );

  return (
    <div className={`border rounded-lg transition-colors ${
      isDark
        ? 'border-gray-600 bg-gray-800/50'
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center space-x-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className={`font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {serviceDefinition.displayName}
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {serviceDefinition.description}
            </p>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
              serviceDefinition.category === 'Networking'
                ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                : serviceDefinition.category === 'Compute'
                ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                : serviceDefinition.category === 'Database'
                ? isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'
                : serviceDefinition.category === 'Storage'
                ? isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800'
                : serviceDefinition.category === 'Observability'
                ? isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                : serviceDefinition.category === 'Integration'
                ? isDark ? 'bg-pink-900 text-pink-300' : 'bg-pink-100 text-pink-800'
                : serviceDefinition.category === 'Security'
                ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
            }`}>
              {serviceDefinition.category}
            </span>
          </div>
        </div>

        {enabledField && (
          <div onClick={(e) => e.stopPropagation()}>
            <DynamicFieldRenderer
              fieldConfig={enabledField}
              value={serviceConfig.enabled}
              onChange={handleFieldChange}
              fieldName="enabled"
            />
          </div>
        )}
      </div>

      {expanded && serviceConfig.enabled && (
        <div className={`border-t p-4 space-y-4 ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          {otherFields.map(([fieldName, fieldConfig]) => {
            // Skip complex object fields for now - they need special handling
            if (fieldConfig.type === FIELD_TYPES.OBJECT || fieldConfig.type === FIELD_TYPES.ARRAY) {
              return null;
            }

            return (
              <DynamicFieldRenderer
                key={fieldName}
                fieldConfig={fieldConfig}
                value={serviceConfig[fieldName]}
                onChange={handleFieldChange}
                fieldName={fieldName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DynamicServiceConfig;
