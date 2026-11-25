// src/components/DynamicServiceConfig.js
// One service row of the wizard: icon, name, one line, Aura and the switch.
// An enabled row opens to the service's catalog fields, in catalog order.
import { ChevronRight, Sparkles, TriangleAlert } from "lucide-react";
import { FIELD_TYPES, getServiceConfig } from "../config/servicesConfig";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import ServiceIcon from "./icons/ServiceIcon";
import { summaryOf } from "./environment-detail/ServicesList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Controls that need the full width of the two-column field grid.
const WIDE_FIELDS = new Set([
  FIELD_TYPES.ARRAY,
  FIELD_TYPES.OBJECT,
  FIELD_TYPES.TEXTAREA,
  FIELD_TYPES.MULTISELECT,
  FIELD_TYPES.DYNAMIC_LIST,
]);

const DynamicServiceConfig = ({
  serviceName,
  serviceConfig,
  onServiceChange,
  expanded,
  onToggleExpanded,
  onAskAI,
  missingPrerequisite,
}) => {
  const serviceDefinition = getServiceConfig(serviceName);

  if (!serviceDefinition) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    onServiceChange(serviceName, {
      ...serviceConfig,
      [fieldName]: value,
    });
  };

  const name = serviceDefinition.displayName;
  const enabled = Boolean(serviceConfig.enabled);
  const open = enabled && Boolean(expanded);
  const enabledField = serviceDefinition.fields.enabled;
  const otherFields = Object.entries(serviceDefinition.fields).filter(
    ([fieldName]) => fieldName !== "enabled",
  );
  const line =
    (enabled &&
      !open &&
      summaryOf(serviceName, serviceConfig, serviceDefinition)) ||
    serviceDefinition.description;
  const askLabel = `Ask Aura about ${name}`;

  return (
    <li>
      <Collapsible open={open} onOpenChange={() => onToggleExpanded()}>
        <div
          className={cn(
            "relative flex items-center gap-3 px-3.5 py-3 transition-[background-color] duration-(--dur-fast)",
            // The name is a stretched trigger: the whole row opens it, the
            // controls sit above it.
            "has-[[data-stretched]:hover]:bg-muted/40 has-[[data-stretched]:focus-visible]:ring-2 has-[[data-stretched]:focus-visible]:ring-ring has-[[data-stretched]:focus-visible]:ring-inset",
          )}
        >
          <ServiceIcon service={serviceName} className="size-8" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-medium">
                {enabled ? (
                  <CollapsibleTrigger
                    data-stretched
                    className="text-left outline-none after:absolute after:inset-0"
                  >
                    {name}
                  </CollapsibleTrigger>
                ) : (
                  name
                )}
              </h3>
              {missingPrerequisite ? (
                <Badge variant="attention">
                  <TriangleAlert aria-hidden />
                  Needs {missingPrerequisite}
                </Badge>
              ) : null}
            </div>
            {line ? (
              <p className="truncate text-xs text-muted-foreground">{line}</p>
            ) : null}
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={askLabel}
                  onClick={() => onAskAI?.(serviceName, name)}
                  className="text-muted-foreground"
                >
                  <Sparkles aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{askLabel}</TooltipContent>
            </Tooltip>
            {enabledField && (
              <Switch
                checked={enabled}
                onCheckedChange={() => handleFieldChange("enabled", !enabled)}
                aria-label={`Enable ${name}`}
              />
            )}
          </div>
          <ChevronRight
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-(--dur-fast)",
              open && "rotate-90",
              !enabled && "invisible",
            )}
          />
        </div>

        <CollapsibleContent className="border-t border-border bg-muted/30 px-3.5 py-4 sm:pl-14.5">
          <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
            {otherFields.map(([fieldName, fieldConfig]) => (
              <div
                key={fieldName}
                className={cn(
                  "min-w-0",
                  WIDE_FIELDS.has(fieldConfig.type) && "lg:col-span-2",
                )}
              >
                <DynamicFieldRenderer
                  fieldConfig={fieldConfig}
                  value={serviceConfig[fieldName]}
                  onChange={handleFieldChange}
                  fieldName={fieldName}
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export default DynamicServiceConfig;
