import { SERVICES_CONFIG, FIELD_TYPES } from "../config/servicesConfig";
import { PROVIDERS_CONFIG } from "../config/providersConfig";

export class ConfigValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = "ConfigValidationError";
    this.field = field;
    this.value = value;
  }
}

export const validateField = (fieldConfig, value, fieldName) => {
  const errors = [];

  if (fieldConfig.required && (value === null || value === undefined || value === "")) {
    errors.push(
      new ConfigValidationError(`${fieldConfig.displayName} is required`, fieldName, value)
    );
    return errors;
  }

  if (value === null || value === undefined) {
    return errors;
  }

  switch (fieldConfig.type) {
    case FIELD_TYPES.NUMBER:
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(
          new ConfigValidationError(`${fieldConfig.displayName} must be a number`, fieldName, value)
        );
      } else {
        if (fieldConfig.min !== undefined && value < fieldConfig.min) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} must be at least ${fieldConfig.min}`,
              fieldName,
              value
            )
          );
        }
        if (fieldConfig.max !== undefined && value > fieldConfig.max) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} must be at most ${fieldConfig.max}`,
              fieldName,
              value
            )
          );
        }
      }
      break;

    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      if (typeof value !== "string") {
        errors.push(
          new ConfigValidationError(`${fieldConfig.displayName} must be a string`, fieldName, value)
        );
      } else {
        if (fieldConfig.validation?.pattern && !fieldConfig.validation.pattern.test(value)) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} format is invalid`,
              fieldName,
              value
            )
          );
        }
        if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} must be at least ${fieldConfig.minLength} characters`,
              fieldName,
              value
            )
          );
        }
        if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} must be at most ${fieldConfig.maxLength} characters`,
              fieldName,
              value
            )
          );
        }
      }
      break;

    case FIELD_TYPES.TOGGLE:
      if (typeof value !== "boolean") {
        errors.push(
          new ConfigValidationError(
            `${fieldConfig.displayName} must be true or false`,
            fieldName,
            value
          )
        );
      }
      break;

    case FIELD_TYPES.DROPDOWN:
      if (fieldConfig.options) {
        const validValues = fieldConfig.options.map((opt) => opt.value);
        if (!validValues.includes(value)) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} must be one of: ${validValues.join(", ")}`,
              fieldName,
              value
            )
          );
        }
      }
      break;

    case FIELD_TYPES.MULTISELECT:
      if (!Array.isArray(value)) {
        errors.push(
          new ConfigValidationError(`${fieldConfig.displayName} must be an array`, fieldName, value)
        );
      } else if (fieldConfig.options) {
        const validValues = fieldConfig.options.map((opt) => opt.value);
        const invalidValues = value.filter((v) => !validValues.includes(v));
        if (invalidValues.length > 0) {
          errors.push(
            new ConfigValidationError(
              `${fieldConfig.displayName} contains invalid values: ${invalidValues.join(", ")}`,
              fieldName,
              value
            )
          );
        }
      }
      break;

    case FIELD_TYPES.ARRAY:
      if (!Array.isArray(value)) {
        errors.push(
          new ConfigValidationError(`${fieldConfig.displayName} must be an array`, fieldName, value)
        );
      }
      break;

    case FIELD_TYPES.OBJECT:
      if (typeof value !== "object" || Array.isArray(value) || value === null) {
        errors.push(
          new ConfigValidationError(
            `${fieldConfig.displayName} must be an object`,
            fieldName,
            value
          )
        );
      }
      break;

    default:
      // No validation for unknown field types
      break;
  }

  return errors;
};

export const validateServiceConfig = (serviceName, serviceConfig) => {
  const errors = [];
  const serviceDefinition = SERVICES_CONFIG[serviceName];

  if (!serviceDefinition) {
    errors.push(
      new ConfigValidationError(`Unknown service: ${serviceName}`, "service", serviceName)
    );
    return errors;
  }

  // Validate all fields
  Object.entries(serviceDefinition.fields).forEach(([fieldName, fieldConfig]) => {
    const value = serviceConfig[fieldName];
    const fieldErrors = validateField(fieldConfig, value, fieldName);
    errors.push(...fieldErrors);
  });

  // Custom validation rules for specific services
  if (serviceName === "vpc" && serviceConfig.enabled) {
    if (serviceConfig.publicSubnets + serviceConfig.privateSubnets === 0) {
      errors.push(new ConfigValidationError("VPC must have at least one subnet", "subnets"));
    }
  }

  if (serviceName === "eks" && serviceConfig.enabled) {
    if (serviceConfig.defaultNodeGroupMinSize > serviceConfig.defaultNodeGroupMaxSize) {
      errors.push(
        new ConfigValidationError("Min nodes cannot be greater than max nodes", "nodeCount")
      );
    }
  }

  if (serviceName === "rds" && serviceConfig.enabled) {
    if (serviceConfig.multiAz && serviceConfig.instanceClass?.includes("t2.")) {
      errors.push(
        new ConfigValidationError("Multi-AZ is not supported with t2 instance classes", "multiAz")
      );
    }
  }

  return errors;
};

export const validateEnvironmentConfig = (environment) => {
  const errors = [];

  // Validate basic environment properties
  if (!environment.name || environment.name.trim() === "") {
    errors.push(new ConfigValidationError("Environment name is required", "name"));
  }

  if (!environment.provider) {
    errors.push(new ConfigValidationError("Environment provider is required", "provider"));
  } else if (!PROVIDERS_CONFIG[environment.provider]) {
    errors.push(
      new ConfigValidationError(
        `Invalid provider type: ${environment.provider}`,
        "provider",
        environment.provider
      )
    );
  }

  if (!environment.region) {
    errors.push(new ConfigValidationError("Environment region is required", "region"));
  } else if (environment.provider && PROVIDERS_CONFIG[environment.provider]) {
    const validRegions = PROVIDERS_CONFIG[environment.provider].regions?.map((r) => r.value) || [];
    if (validRegions.length > 0 && !validRegions.includes(environment.region)) {
      errors.push(
        new ConfigValidationError(
          `Invalid region for ${environment.provider}: ${environment.region}`,
          "region",
          environment.region
        )
      );
    }
  }

  // Validate services
  if (environment.services) {
    Object.entries(environment.services).forEach(([serviceName, serviceConfig]) => {
      const serviceErrors = validateServiceConfig(serviceName, serviceConfig);
      errors.push(...serviceErrors);
    });

    // Cross-service validation
    const enabledServices = Object.keys(environment.services).filter(
      (serviceName) => environment.services[serviceName]?.enabled
    );

    // EKS requires VPC
    if (enabledServices.includes("eks") && !enabledServices.includes("vpc")) {
      errors.push(new ConfigValidationError("EKS requires VPC to be enabled", "eks"));
    }

    // RDS requires VPC
    if (enabledServices.includes("rds") && !enabledServices.includes("vpc")) {
      errors.push(new ConfigValidationError("RDS requires VPC to be enabled", "rds"));
    }
  }

  return errors;
};

export const getValidationSummary = (errors) => {
  if (errors.length === 0) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      criticalErrors: [],
      totalErrors: 0,
      hasBlockingErrors: false,
    };
  }

  const criticalErrors = errors.filter(
    (error) => error.field === "name" || error.field === "provider" || error.field === "region"
  );

  const warnings = errors.filter(
    (error) => error.message.includes("recommended") || error.message.includes("should")
  );

  return {
    isValid: false,
    errors,
    warnings,
    criticalErrors,
    totalErrors: errors.length,
    hasBlockingErrors: criticalErrors.length > 0,
  };
};

// Development helper to validate entire config structure
export const validateConfigStructure = () => {
  const errors = [];

  // Validate SERVICES_CONFIG structure
  Object.entries(SERVICES_CONFIG).forEach(([serviceName, serviceConfig]) => {
    if (!serviceConfig.displayName) {
      errors.push(`Service ${serviceName} missing displayName`);
    }
    if (!serviceConfig.fields) {
      errors.push(`Service ${serviceName} missing fields definition`);
    } else {
      Object.entries(serviceConfig.fields).forEach(([fieldName, fieldConfig]) => {
        if (!fieldConfig.type || !Object.values(FIELD_TYPES).includes(fieldConfig.type)) {
          errors.push(`Service ${serviceName}.${fieldName} has invalid field type`);
        }
      });
    }
  });

  return errors;
};

const configValidator = {
  validateField,
  validateServiceConfig,
  validateEnvironmentConfig,
  getValidationSummary,
  validateConfigStructure,
  ConfigValidationError,
};

export default configValidator;
