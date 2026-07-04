// Pure suggestion/validation helpers for the AI chat modal.
// Extracted from AIChatModal.jsx so the intricate config-validation logic can be
// unit-tested in isolation. These functions have no React/component dependencies.
import { SERVICES_CONFIG, FIELD_TYPES } from "../../../config/servicesConfig";

/**
 * Find service configuration key by its display name.
 * Converts human-readable names back to service keys.
 */
export const findServiceByDisplayName = (displayName) => {
  for (const [serviceName, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
    if (serviceConfig.displayName === displayName) {
      return serviceName;
    }
  }
  return null;
};

/**
 * Validate that a value is appropriate for a given field configuration.
 */
export const isValidFieldValue = (value, fieldConfig) => {
  if (value === null || value === undefined) {
    return true; // Allow null/undefined values
  }

  switch (fieldConfig.type) {
    case FIELD_TYPES.TOGGLE:
      return typeof value === "boolean";

    case FIELD_TYPES.NUMBER:
      if (typeof value !== "number") return false;
      if (fieldConfig.min !== undefined && value < fieldConfig.min)
        return false;
      if (fieldConfig.max !== undefined && value > fieldConfig.max)
        return false;
      return true;

    case FIELD_TYPES.DROPDOWN:
      if (!fieldConfig.options) return true; // No options defined, allow any value
      return fieldConfig.options.some((option) => option.value === value);

    case FIELD_TYPES.MULTISELECT:
      if (!Array.isArray(value)) return false;
      if (!fieldConfig.options) return true; // No options defined, allow any values
      return value.every((v) =>
        fieldConfig.options.some((option) => option.value === v),
      );

    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      if (typeof value !== "string") return false;
      if (fieldConfig.validation?.pattern) {
        return fieldConfig.validation.pattern.test(value);
      }
      return true;

    case FIELD_TYPES.ARRAY:
      return Array.isArray(value);

    case FIELD_TYPES.OBJECT:
      return (
        typeof value === "object" && value !== null && !Array.isArray(value)
      );

    default:
      return true; // Unknown field type, allow any value
  }
};

/**
 * Extract configuration suggestions from AI response text.
 * Looks for ANY JSON code block and validates it against the service's fields
 * AND values; returns the validated config only if it differs from the current
 * one (in wizardValues), else {}.
 */
export const extractSuggestionsFromText = (
  text,
  currentServiceName,
  wizardValues,
) => {
  // Extract JSON code blocks (removed keyword check)
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());

      const serviceConfig = SERVICES_CONFIG[currentServiceName];
      if (!serviceConfig) return {};

      const validFields = Object.keys(serviceConfig.fields);

      let configToCheck = parsed;
      const keys = Object.keys(parsed);
      if (
        keys.length === 1 &&
        typeof parsed[keys[0]] === "object" &&
        parsed[keys[0]] !== null
      ) {
        configToCheck = parsed[keys[0]];
      }

      // Validate both field names AND field values
      const validatedConfig = {};
      let hasValidFields = false;

      for (const [key, value] of Object.entries(configToCheck)) {
        if (!validFields.includes(key)) continue;

        const fieldConfig = serviceConfig.fields[key];

        // Validate the value based on field type
        if (isValidFieldValue(value, fieldConfig)) {
          validatedConfig[key] = value;
          hasValidFields = true;
        } else {
          console.warn(
            `Invalid value "${value}" for field "${key}" of type "${fieldConfig.type}". Skipping field.`,
          );
        }
      }

      if (!hasValidFields) return {};

      // Check if suggested config is different from current config
      const currentServiceConfig =
        wizardValues?.services?.[currentServiceName] || {};
      let isDifferent = false;
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (currentServiceConfig[key] !== value) {
          isDifferent = true;
          break;
        }
      }

      // Only return suggestion if it's actually different
      return isDifferent ? validatedConfig : {};
    } catch (err) {
      console.warn("Invalid JSON suggestion:", err);
    }
  }

  return {};
};

/**
 * Generic validation system that works across all services based on field
 * definitions. Returns { warnings, fixes }.
 */
export const validateServiceConfiguration = (serviceName, config) => {
  const warnings = [];
  const fixes = {};

  const serviceConfig = SERVICES_CONFIG[serviceName];
  if (!serviceConfig) return { warnings, fixes };

  // Get field definitions for validation
  const fields = serviceConfig.fields;

  // Validate each field against its constraints
  Object.entries(config).forEach(([fieldName, value]) => {
    const fieldDef = fields[fieldName];
    if (!fieldDef) return;

    // Validate number constraints
    if (fieldDef.type === FIELD_TYPES.NUMBER && typeof value === "number") {
      if (fieldDef.min !== undefined && value < fieldDef.min) {
        warnings.push(
          `${fieldDef.displayName || fieldName} is below minimum (${fieldDef.min})`,
        );
        fixes[fieldName] = fieldDef.min;
      }
      if (fieldDef.max !== undefined && value > fieldDef.max) {
        warnings.push(
          `${fieldDef.displayName || fieldName} exceeds maximum (${fieldDef.max})`,
        );
        fixes[fieldName] = fieldDef.max;
      }
    }

    // Validate dropdown values
    if (fieldDef.type === FIELD_TYPES.DROPDOWN && fieldDef.options) {
      const validValues = fieldDef.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        warnings.push(
          `Invalid ${fieldDef.displayName || fieldName}: "${value}". Using default.`,
        );
        fixes[fieldName] = fieldDef.defaultValue;
      }
    }

    // Validate multiselect arrays
    if (
      fieldDef.type === FIELD_TYPES.MULTISELECT &&
      Array.isArray(value) &&
      fieldDef.options
    ) {
      const validValues = fieldDef.options.map((opt) => opt.value);
      const invalidValues = value.filter((v) => !validValues.includes(v));
      if (invalidValues.length > 0) {
        warnings.push(
          `Invalid ${fieldDef.displayName || fieldName} values: ${invalidValues.join(", ")}`,
        );
        fixes[fieldName] = value.filter((v) => validValues.includes(v));
        if (fixes[fieldName].length === 0 && fieldDef.defaultValue) {
          fixes[fieldName] = fieldDef.defaultValue;
        }
      }
    }

    // Validate text patterns
    if (
      (fieldDef.type === FIELD_TYPES.TEXT ||
        fieldDef.type === FIELD_TYPES.TEXTAREA) &&
      typeof value === "string" &&
      fieldDef.validation?.pattern
    ) {
      if (!fieldDef.validation.pattern.test(value)) {
        warnings.push(`${fieldDef.displayName || fieldName} format is invalid`);
        if (fieldDef.defaultValue) {
          fixes[fieldName] = fieldDef.defaultValue;
        }
      }
    }
  });

  // Generic cross-field validations using common naming patterns
  const fieldNames = Object.keys(config);

  // Min/Max value pairs (works for any service with min*/max* fields)
  fieldNames.forEach((fieldName) => {
    if (fieldName.startsWith("min")) {
      const maxFieldName = fieldName.replace("min", "max");
      if (
        config[maxFieldName] !== undefined &&
        config[fieldName] > config[maxFieldName]
      ) {
        warnings.push(`${fieldName} cannot exceed ${maxFieldName}`);
        fixes[maxFieldName] = Math.max(
          config[fieldName],
          config[maxFieldName] || config[fieldName],
        );
      }
    }

    if (
      fieldName.startsWith("max") &&
      fieldName !== "maxNodes" &&
      fieldName !== "maxAllocatedStorage"
    ) {
      const minFieldName = fieldName.replace("max", "min");
      if (
        config[minFieldName] !== undefined &&
        config[fieldName] < config[minFieldName]
      ) {
        warnings.push(`${fieldName} cannot be less than ${minFieldName}`);
        fixes[fieldName] = Math.max(
          config[minFieldName],
          config[fieldName] || config[minFieldName],
        );
      }
    }
  });

  // Auto-scaling logic (generic for any service with enableAutoScaling)
  if (Object.hasOwn(config, "enableAutoScaling") && !config.enableAutoScaling) {
    // If auto-scaling is disabled, min and max should be equal
    const minField = fieldNames.find(
      (f) => f.includes("min") && f.includes("Node"),
    );
    const maxField = fieldNames.find(
      (f) => f.includes("max") && f.includes("Node"),
    );

    if (minField && maxField && config[minField] !== config[maxField]) {
      warnings.push(
        `Auto-scaling disabled: ${minField} and ${maxField} should be equal`,
      );
      fixes[maxField] = config[minField];
    }
  }

  // Storage validation (generic for allocated/max storage patterns)
  if (
    config.allocatedStorage &&
    config.maxAllocatedStorage &&
    config.maxAllocatedStorage < config.allocatedStorage
  ) {
    warnings.push("Maximum storage cannot be less than allocated storage");
    fixes.maxAllocatedStorage = Math.max(
      config.allocatedStorage * 2,
      config.maxAllocatedStorage,
    );
  }

  // Disk size recommendations (generic minimum disk size check)
  const diskFields = fieldNames.filter(
    (f) =>
      f.toLowerCase().includes("disk") &&
      fields[f]?.type === FIELD_TYPES.NUMBER,
  );
  diskFields.forEach((diskField) => {
    if (config[diskField] && config[diskField] < 20) {
      warnings.push(
        `${fields[diskField].displayName || diskField} may be too small`,
      );
      fixes[diskField] = Math.max(50, fields[diskField].defaultValue || 50);
    }
  });

  // Enable/disable dependency validation
  Object.entries(config).forEach(([fieldName, value]) => {
    if (typeof value === "boolean" && value === true) {
      // Look for related fields that might need to be enabled
      const relatedFields = fieldNames.filter(
        (f) =>
          f !== fieldName &&
          (f.includes(fieldName.replace("enable", "").replace("Enable", "")) ||
            fieldName.includes(f.replace("enable", "").replace("Enable", ""))),
      );

      relatedFields.forEach((relatedField) => {
        if (
          typeof config[relatedField] === "boolean" &&
          config[relatedField] === false
        ) {
          // Don't auto-enable, just warn about potential conflicts
          const fieldDisplayName = fields[fieldName]?.displayName || fieldName;
          const relatedDisplayName =
            fields[relatedField]?.displayName || relatedField;
          warnings.push(
            `${fieldDisplayName} enabled but ${relatedDisplayName} is disabled - verify this is intentional`,
          );
        }
      });
    }
  });

  return { warnings, fixes };
};
