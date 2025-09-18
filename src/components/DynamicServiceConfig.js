// src/components/DynamicServiceConfig.js
import React from 'react';
import { ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { getServiceConfig, FIELD_TYPES } from '../config/servicesConfig';
import { useTheme } from '../contexts/ThemeContext';
import DynamicFieldRenderer from './DynamicFieldRenderer';

const DynamicServiceConfig = ({
  serviceName,
  serviceConfig,
  onServiceChange,
  expanded,
  onToggleExpanded,
  onEditHelmValues,
  onAskAI
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
        : 'border-gray-200 bg-white'
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

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {/* Ask AI Button */}
          <button
            type="button"
            onClick={() => onAskAI?.(serviceName, serviceDefinition.displayName)}
            className="p-1.5 text-teal-400 hover:text-teal-300 transition-colors hover:bg-teal-500/10 rounded-md"
            title="Ask AI about this service"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {enabledField && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={serviceConfig.enabled}
                onChange={() => handleFieldChange('enabled', !serviceConfig.enabled)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}></div>
            </label>
          )}
        </div>
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
