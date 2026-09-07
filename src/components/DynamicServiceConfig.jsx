// src/components/DynamicServiceConfig.js
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { getServiceConfig } from "../config/servicesConfig";
import { getServiceIcon } from "../config/serviceIcons";
import DynamicFieldRenderer from "./DynamicFieldRenderer";

const DynamicServiceConfig = ({
  serviceName,
  serviceConfig,
  onServiceChange,
  expanded,
  onToggleExpanded,
  onAskAI,
}) => {
  const serviceDefinition = getServiceConfig(serviceName);
  const ServiceIcon = getServiceIcon(serviceName);

  if (!serviceDefinition) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    onServiceChange(serviceName, {
      ...serviceConfig,
      [fieldName]: value,
    });
  };

  const enabledField = serviceDefinition.fields.enabled;
  const otherFields = Object.entries(serviceDefinition.fields).filter(
    ([fieldName]) => fieldName !== "enabled",
  );

  return (
    <div
      className={`rounded-lg transition-colors bg-surface ${
        serviceConfig.enabled
          ? "border-2 border-primary"
          : "border border-border"
      }`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center space-x-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-tertiary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tertiary" />
          )}
          <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center shrink-0">
            <ServiceIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-primary">
              {serviceDefinition.displayName}
            </h3>
            <p className="text-sm text-secondary">
              {serviceDefinition.description}
            </p>
            <span className="mt-1 inline-block rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tertiary">
              {serviceDefinition.category}
            </span>
          </div>
        </div>

        <div
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ask AI Button */}
          <button
            type="button"
            onClick={() =>
              onAskAI?.(serviceName, serviceDefinition.displayName)
            }
            className="p-1.5 text-accent hover:bg-primary-muted transition-colors rounded-md"
            title="Ask AI about this service"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {enabledField && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={serviceConfig.enabled}
                onChange={() =>
                  handleFieldChange("enabled", !serviceConfig.enabled)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow after:rounded-full after:h-5 after:w-5 after:transition-all bg-border"></div>
            </label>
          )}
        </div>
      </div>

      {expanded && serviceConfig.enabled && (
        <div className="border-t p-4 space-y-4 border-border">
          {otherFields.map(([fieldName, fieldConfig]) => {
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
