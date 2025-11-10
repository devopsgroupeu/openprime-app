// src/components/DynamicFieldRenderer.js
import React from "react";
import { FIELD_TYPES } from "../config/servicesConfig";
import { useTheme } from "../contexts/ThemeContext";

const DynamicFieldRenderer = ({ fieldConfig, value, onChange, fieldName, disabled = false }) => {
  const { isDark } = useTheme();

  const handleChange = (newValue) => {
    onChange(fieldName, newValue);
  };

  const baseInputClasses = `w-full px-4 py-2 rounded-lg border transition-colors ${
    isDark
      ? "bg-gray-700 border-gray-600 text-white focus:border-primary"
      : "bg-white border-gray-300 text-primary focus:border-primary"
  } focus:ring-2 focus:ring-primary/20 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const labelClasses = "block text-sm font-medium mb-1 text-primary font-poppins";

  const descriptionClasses = "text-xs mt-1 text-tertiary font-poppins";

  switch (fieldConfig.type) {
    case FIELD_TYPES.TOGGLE:
      return (
        <div className="flex items-center justify-between">
          <div>
            <label className={labelClasses}>{fieldConfig.displayName}</label>
            {fieldConfig.description && (
              <p className={descriptionClasses}>{fieldConfig.description}</p>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={() => !disabled && handleChange(!value)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                isDark ? "bg-gray-700" : "bg-gray-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            ></div>
          </label>
        </div>
      );

    case FIELD_TYPES.DROPDOWN:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
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
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );

    case FIELD_TYPES.MULTISELECT:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
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
                      : value.filter((v) => v !== option.value);
                    handleChange(newValue);
                  }}
                  disabled={disabled}
                  className="mr-2 rounded"
                />
                <span className="text-primary font-poppins">{option.label}</span>
              </label>
            ))}
          </div>
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );

    case FIELD_TYPES.NUMBER:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
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
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );

    case FIELD_TYPES.TEXTAREA:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            rows={4}
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );

    case FIELD_TYPES.ARRAY:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <textarea
            value={Array.isArray(value) ? value.join("\n") : ""}
            onChange={(e) => {
              const lines = e.target.value.split("\n").filter((line) => line.trim() !== "");
              handleChange(lines);
            }}
            disabled={disabled}
            rows={4}
            placeholder="Enter one item per line"
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
          {Array.isArray(value) && value.length > 0 && (
            <p className="text-xs mt-1 text-gray-500">
              {value.length} item{value.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      );

    case FIELD_TYPES.OBJECT:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <textarea
            value={typeof value === "object" ? JSON.stringify(value, null, 2) : ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            disabled={disabled}
            rows={6}
            placeholder='{"key": "value"}'
            className={`${baseInputClasses} font-mono text-sm`}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
          <p className="text-xs mt-1 text-gray-500">JSON format</p>
        </div>
      );

    case FIELD_TYPES.TEXT:
    default:
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );
  }
};

export default DynamicFieldRenderer;
