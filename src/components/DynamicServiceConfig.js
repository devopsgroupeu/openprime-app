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
  onToggleExpanded,
  onEditHelmValues
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
    <div className={`border rounded-lg transition-colors shadow-sm hover:shadow-md ${
      isDark
        ? 'border-gray-600 bg-gray-800/50'
        : 'border-gray-200 bg-white/80'
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
                ? isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                : serviceDefinition.category === 'Compute'
                ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                : serviceDefinition.category === 'Database'
                ? isDark ? 'bg-teal-900 text-teal-300' : 'bg-teal-50 text-teal-700'
                : serviceDefinition.category === 'Storage'
                ? isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-50 text-orange-700'
                : serviceDefinition.category === 'Observability'
                ? isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                : serviceDefinition.category === 'Integration'
                ? isDark ? 'bg-pink-900 text-pink-300' : 'bg-pink-50 text-pink-700'
                : serviceDefinition.category === 'Security'
                ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'
            }`}>
              {serviceDefinition.category}
            </span>
          </div>
        </div>

        {enabledField && (
          <div onClick={(e) => e.stopPropagation()}>
            {/* Custom toggle for enabled field without text/description */}
            <button
              type="button"
              onClick={() => handleFieldChange('enabled', !serviceConfig.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                serviceConfig.enabled
                  ? 'bg-teal-600'
                  : isDark
                  ? 'bg-gray-600'
                  : 'bg-gray-200'
              } cursor-pointer`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  serviceConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {expanded && serviceConfig.enabled && (
        <div className={`border-t p-4 space-y-4 ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}>
          {otherFields.map(([fieldName, fieldConfig]) => {
            // Skip complex object/array fields except for helm charts - they need special handling
            if ((fieldConfig.type === FIELD_TYPES.OBJECT || fieldConfig.type === FIELD_TYPES.ARRAY) &&
                fieldConfig.type !== FIELD_TYPES.HELM_CHARTS) {
              return null;
            }

            // For helm charts, we need to pass the onEditHelmValues function
            const enhancedFieldConfig = fieldConfig.type === FIELD_TYPES.HELM_CHARTS ?
              { ...fieldConfig, onEditHelmValues } : fieldConfig;

            return (
              <DynamicFieldRenderer
                key={fieldName}
                fieldConfig={enhancedFieldConfig}
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
