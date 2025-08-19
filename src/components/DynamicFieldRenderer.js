// src/components/DynamicFieldRenderer.js
import React from 'react';
import { FIELD_TYPES } from '../config/servicesConfig';
import { useTheme } from '../contexts/ThemeContext';

const DynamicFieldRenderer = ({ fieldConfig, value, onChange, fieldName, disabled = false }) => {
  const { isDark } = useTheme();

  const handleChange = (newValue) => {
    onChange(fieldName, newValue);
  };

  const baseInputClasses = `w-full px-3 py-2 border rounded-lg transition-colors ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
      : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const labelClasses = `block text-sm font-medium mb-1 ${
    isDark ? 'text-gray-300' : 'text-gray-700'
  }`;

  const descriptionClasses = `text-xs mt-1 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  switch (fieldConfig.type) {
    case FIELD_TYPES.TOGGLE:
      return (
        <div className="flex items-center justify-between">
          <div>
            <label className={labelClasses}>
              {fieldConfig.displayName}
            </label>
            {fieldConfig.description && (
              <p className={descriptionClasses}>
                {fieldConfig.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !disabled && handleChange(!value)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value
                ? 'bg-teal-600'
                : isDark
                ? 'bg-gray-600'
                : 'bg-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );

    case FIELD_TYPES.DROPDOWN:
      return (
        <div>
          <label className={labelClasses}>
            {fieldConfig.displayName}
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            {fieldConfig.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldConfig.description && (
            <p className={descriptionClasses}>
              {fieldConfig.description}
            </p>
          )}
        </div>
      );

    case FIELD_TYPES.MULTISELECT:
      return (
        <div>
          <label className={labelClasses}>
            {fieldConfig.displayName}
          </label>
          <div className="space-y-2">
            {fieldConfig.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    if (!Array.isArray(value)) return;
                    const newValue = e.target.checked
                      ? [...value, option.value]
                      : value.filter(v => v !== option.value);
                    handleChange(newValue);
                  }}
                  disabled={disabled}
                  className="mr-2 rounded"
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {fieldConfig.description && (
            <p className={descriptionClasses}>
              {fieldConfig.description}
            </p>
          )}
        </div>
      );

    case FIELD_TYPES.NUMBER:
      return (
        <div>
          <label className={labelClasses}>
            {fieldConfig.displayName}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
            min={fieldConfig.min}
            max={fieldConfig.max}
            disabled={disabled}
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>
              {fieldConfig.description}
            </p>
          )}
        </div>
      );

    case FIELD_TYPES.TEXTAREA:
      return (
        <div>
          <label className={labelClasses}>
            {fieldConfig.displayName}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            rows={4}
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>
              {fieldConfig.description}
            </p>
          )}
        </div>
      );


    case FIELD_TYPES.TEXT:
    default:
      return (
        <div>
          <label className={labelClasses}>
            {fieldConfig.displayName}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>
              {fieldConfig.description}
            </p>
          )}
        </div>
      );
  }
};

export default DynamicFieldRenderer;
