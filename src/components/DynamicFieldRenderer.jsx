// src/components/DynamicFieldRenderer.js
import React from "react";
import { FIELD_TYPES } from "../config/servicesConfig";

const DynamicFieldRenderer = ({
  fieldConfig,
  value,
  onChange,
  fieldName,
  disabled = false,
}) => {
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
      setJsonText(
        typeof value === "object" ? JSON.stringify(value, null, 2) : "",
      );
    }
  }, [value, fieldConfig.type]);

  const handleChange = (newValue) => {
    onChange(fieldName, newValue);
  };

  const baseInputClasses = `w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const labelClasses =
    "block text-sm font-medium mb-1 text-primary font-poppins";

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
              className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow after:rounded-full after:h-5 after:w-5 after:transition-all bg-border ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            ></div>
          </label>
        </div>
      );

    case FIELD_TYPES.DROPDOWN: {
      // A stored value the option list no longer offers has to stay visible.
      // A plain controlled <select> whose value matches no <option> does NOT
      // render blank — the browser falls back to the FIRST option, so an
      // environment saved with EKS 1.32 would display "1.34" while still
      // holding 1.32 (onChange never fires, so nothing corrects it). The user
      // then sees a value the environment does not have, and a save is
      // rejected by configValidator for a version the UI never showed them.
      //
      // This is not a one-off for today's EKS bump: option lists that track a
      // vendor's supported versions rotate — roughly every 4 months for EKS —
      // so every rotation orphans the environments sitting on the dropped
      // value. Handling it here fixes the class for every dropdown rather than
      // once per list.
      //
      // Rendered `disabled` so it shows as the current selection but cannot be
      // chosen again once the user moves off it.
      const options = fieldConfig.options ?? [];
      const isOrphaned =
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !options.some((option) => option.value === value);

      return (
        <div>
          <label className={labelClasses}>{fieldConfig.displayName}</label>
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            {isOrphaned && (
              <option key={value} value={value} disabled>
                {`${value} — no longer supported`}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isOrphaned && (
            <p className="text-xs mt-1 text-amber-600 dark:text-amber-500 font-poppins">
              This environment uses a value that is no longer offered. Pick a
              supported one before saving.
            </p>
          )}
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
        </div>
      );
    }

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
                <span className="text-primary font-poppins">
                  {option.label}
                </span>
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
              const lines = e.target.value
                .split("\n")
                .filter((line) => line.trim() !== "");
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
            <p className="text-xs mt-1 text-tertiary">
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
            className={`${baseInputClasses} font-mono text-sm ${jsonError ? "border-danger" : ""}`}
          />
          {fieldConfig.description && (
            <p className={descriptionClasses}>{fieldConfig.description}</p>
          )}
          {jsonError ? (
            <p className="text-xs mt-1 text-danger">
              Invalid JSON: {jsonError}
            </p>
          ) : (
            <p className="text-xs mt-1 text-tertiary">JSON format</p>
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
                className="border rounded-lg transition-colors border-border bg-background-secondary"
              >
                {/* Item Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
                  onClick={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedIndex(expandedIndex === index ? null : index);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {expandedIndex === index ? "▼" : "▶"}
                    </span>
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
                    className={`btn-op-danger text-sm ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Remove
                  </button>
                </div>

                {/* Expanded Item Fields */}
                {expandedIndex === index && (
                  <div className="p-4 pt-2 border-t border-border space-y-4">
                    {Object.entries(fieldConfig.itemSchema).map(
                      ([itemFieldName, itemFieldConfig]) => (
                        <DynamicFieldRenderer
                          key={itemFieldName}
                          fieldConfig={itemFieldConfig}
                          value={item[itemFieldName]}
                          onChange={(_, newValue) =>
                            updateItem(index, itemFieldName, newValue)
                          }
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
              className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors font-medium border-border hover:border-primary hover:bg-primary-muted text-secondary hover:text-primary ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              + Add {fieldConfig.displayName?.replace(/s$/, "") || "Item"}
            </button>

            {listValue.length > 0 && (
              <p className="text-xs text-tertiary">
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
