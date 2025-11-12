// src/components/DynamicFieldRenderer.js
import React from "react";
import { FIELD_TYPES } from "../config/servicesConfig";
import { useTheme } from "../contexts/ThemeContext";

const DynamicFieldRenderer = ({ fieldConfig, value, onChange, fieldName, disabled = false }) => {
  const { isDark } = useTheme();

  // Initialize all hooks at the top level
  const [jsonText, setJsonText] = React.useState(
    typeof value === "object" && fieldConfig.type === FIELD_TYPES.OBJECT
      ? JSON.stringify(value, null, 2)
      : "",
  );
  const [jsonError, setJsonError] = React.useState("");
  const [expandedIndex, setExpandedIndex] = React.useState(null);

  React.useEffect(() => {
    // Update JSON text when value changes from outside
    if (fieldConfig.type === FIELD_TYPES.OBJECT) {
      setJsonText(typeof value === "object" ? JSON.stringify(value, null, 2) : "");
    }
  }, [value, fieldConfig.type]);

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

    case FIELD_TYPES.OBJECT: {
      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <textarea
            value={jsonText}
            onChange={(e) => {
              const newText = e.target.value;
              setJsonText(newText);

              try {
                const parsed = JSON.parse(newText);
                handleChange(parsed);
                setJsonError("");
              } catch (error) {
                // Invalid JSON - show error but allow typing
                setJsonError(error.message);
              }
            }}
            onBlur={() => {
              // On blur, try to format valid JSON
              try {
                const parsed = JSON.parse(jsonText);
                const formatted = JSON.stringify(parsed, null, 2);
                setJsonText(formatted);
                setJsonError("");
              } catch {
                // Keep invalid JSON as-is
              }
            }}
            disabled={disabled}
            rows={6}
            placeholder='{"key": "value"}'
            className={`${baseInputClasses} font-mono text-sm ${jsonError ? "border-red-500" : ""}`}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
          {jsonError ? (
            <p className="text-xs mt-1 text-red-500">Invalid JSON: {jsonError}</p>
          ) : (
            <p className="text-xs mt-1 text-gray-500">JSON format</p>
          )}
        </div>
      );
    }

    case FIELD_TYPES.DYNAMIC_LIST: {
      const listValue = Array.isArray(value) ? value : [];

      const createDefaultItem = () => {
        const defaultItem = {};
        Object.entries(fieldConfig.itemSchema).forEach(([key, schema]) => {
          defaultItem[key] =
            schema.defaultValue !== undefined
              ? schema.defaultValue
              : schema.type === FIELD_TYPES.TOGGLE
                ? false
                : schema.type === FIELD_TYPES.NUMBER
                  ? 0
                  : "";
        });
        return defaultItem;
      };

      const addItem = () => {
        const newItem = createDefaultItem();
        const newList = [...listValue, newItem];
        handleChange(newList);
        setExpandedIndex(newList.length - 1);
      };

      const removeItem = (index) => {
        const newList = listValue.filter((_, i) => i !== index);
        handleChange(newList);
        if (expandedIndex === index) {
          setExpandedIndex(null);
        } else if (expandedIndex > index) {
          setExpandedIndex(expandedIndex - 1);
        }
      };

      const updateItem = (index, itemFieldName, itemValue) => {
        const newList = [...listValue];
        newList[index] = { ...newList[index], [itemFieldName]: itemValue };
        handleChange(newList);
      };

      const getItemDisplayName = (item, index) => {
        // Try to find a 'name' field or use index
        return item.name || `Item ${index + 1}`;
      };

      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}

          <div className="space-y-2 mt-2">
            {listValue.map((item, index) => (
              <div
                key={index}
                className={`border rounded-lg transition-colors ${
                  isDark ? "border-gray-600 bg-gray-750" : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Item Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedIndex(expandedIndex === index ? null : index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{expandedIndex === index ? "▼" : "▶"}</span>
                    <span className="font-medium text-primary">
                      {getItemDisplayName(item, index)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    disabled={disabled}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      isDark
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Remove
                  </button>
                </div>

                {/* Expanded Item Fields */}
                {expandedIndex === index && (
                  <div
                    className="p-4 pt-2 border-t space-y-4"
                    style={{
                      borderColor: isDark ? "rgb(75, 85, 99)" : "rgb(229, 231, 235)",
                    }}
                  >
                    {Object.entries(fieldConfig.itemSchema).map(
                      ([itemFieldName, itemFieldConfig]) => (
                        <DynamicFieldRenderer
                          key={itemFieldName}
                          fieldConfig={itemFieldConfig}
                          value={item[itemFieldName]}
                          onChange={(_, newValue) => updateItem(index, itemFieldName, newValue)}
                          fieldName={itemFieldName}
                          disabled={disabled}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Button */}
            <button
              type="button"
              onClick={addItem}
              disabled={disabled}
              className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors font-medium ${
                isDark
                  ? "border-gray-600 hover:border-primary hover:bg-gray-750 text-gray-400 hover:text-primary"
                  : "border-gray-300 hover:border-primary hover:bg-gray-50 text-gray-600 hover:text-primary"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              + Add {fieldConfig.displayName?.replace(/s$/, "") || "Item"}
            </button>

            {listValue.length > 0 && (
              <p className="text-xs text-gray-500">
                {listValue.length} item{listValue.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      );
    }

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
