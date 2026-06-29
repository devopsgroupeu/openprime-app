import { Box, ChevronDown, ChevronRight } from "lucide-react";
import { getServiceConfig } from "../../config/servicesConfig";
import { getServiceIcon } from "../../config/serviceIcons";

const ServicesList = ({ environment, expandedServices, onToggleService }) => {
  // const getServiceStatus = (serviceConfig) => {
  //   if (!serviceConfig?.enabled) return 'disabled';
  //   return 'enabled';
  // };

  // const getStatusIcon = (status) => {
  //   if (status === 'enabled') {
  //     return <CheckCircle className="w-4 h-4 text-green-400" />;
  //   }
  //   return <Clock className="w-4 h-4 text-gray-400" />;
  // };

  const enabledServices = Object.entries(environment.services || {})
    .filter(([_, config]) => config?.enabled)
    .sort(([a], [b]) => a.localeCompare(b));

  const formatConfigValue = (value) => {
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getImportantAttributes = (serviceConfig, serviceName) => {
    const importantKeys = {
      vpc: ["cidrBlock", "region", "enableDnsSupport"],
      eks: ["version", "nodeGroups", "addons"],
      rds: ["engine", "instanceType", "allocatedStorage"],
      s3: ["bucketName", "versioning", "encryption"],
      ecr: ["repositoryName", "imageScanningConfiguration"],
      opensearch: ["version", "instanceType", "instanceCount"],
      lambda: ["runtime", "memorySize", "timeout"],
      elasticache: ["engine", "nodeType", "numNodes"],
      secretsmanager: ["secretName", "description"],
      iam: ["roleName", "policies"],
    };

    const keys =
      importantKeys[serviceName] || Object.keys(serviceConfig).slice(0, 3);
    return Object.entries(serviceConfig)
      .filter(([key]) => keys.includes(key) && key !== "enabled")
      .slice(0, 4);
  };

  const humanizeKey = (key) =>
    key
      .replace(/_/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Build a compact, human chip for the collapsed summary line.
  const summaryChip = (key, value) => {
    if (value === false || value === null || value === undefined) return null;
    if (key.toLowerCase() === "version") return `v${value}`;
    if (value === true) return humanizeKey(key).replace(/^Enable\s+/, "");
    if (typeof value === "number") return `${value} ${humanizeKey(key)}`;
    if (typeof value === "object") return null;
    return String(value);
  };

  const ServiceItem = ({ serviceName, serviceConfig }) => {
    const serviceDefinition = getServiceConfig(serviceName);
    const IconComponent = getServiceIcon(serviceName);
    const isExpanded = expandedServices[serviceName];
    const importantAttrs = getImportantAttributes(serviceConfig, serviceName);
    const allAttrs = Object.entries(serviceConfig).filter(
      ([key]) => key !== "enabled" && key !== "helmCharts",
    );
    const summary = importantAttrs
      .map(([key, value]) => summaryChip(key, value))
      .filter(Boolean)
      .join(" · ");

    return (
      <div className="rounded-2xl border bg-surface border-border p-5 transition-all duration-200 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-lg bg-primary-muted border border-primary shrink-0">
              <IconComponent className="w-6 h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-primary truncate">
                {serviceDefinition?.displayName || serviceName.toUpperCase()}
              </h4>
              <p className="text-xs text-tertiary truncate mt-0.5">
                {summary ||
                  serviceDefinition?.description ||
                  "AWS service configuration"}
              </p>
            </div>
          </div>
          {allAttrs.length > 0 && (
            <button
              onClick={() => onToggleService(serviceName)}
              aria-label={
                isExpanded ? "Collapse configuration" : "Expand configuration"
              }
              className="p-2 -mr-1 rounded-lg shrink-0 transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {isExpanded && allAttrs.length > 0 && (
          <dl className="mt-4 pt-4 border-t border-border space-y-2.5">
            {allAttrs.map(([key, value]) => {
              const formatted = formatConfigValue(value);
              const stacked =
                (typeof value === "object" && value !== null) ||
                formatted.length > 28;
              return (
                <div
                  key={key}
                  className={
                    stacked ? "" : "flex items-baseline justify-between gap-4"
                  }
                >
                  <dt className="text-xs text-tertiary shrink-0">
                    {humanizeKey(key)}
                  </dt>
                  <dd
                    className={
                      stacked
                        ? "mt-1 text-xs font-mono text-primary whitespace-pre-wrap break-words"
                        : "text-sm font-mono text-primary text-right truncate"
                    }
                  >
                    {formatted}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    );
  };

  // Split into two fixed columns in DOM order (round-robin) so expanding one
  // card grows only its own column — no height-based reshuffling, no row gaps.
  const serviceColumns = [[], []];
  enabledServices.forEach((entry, i) => serviceColumns[i % 2].push(entry));

  return (
    <div className="space-y-6">
      {enabledServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {serviceColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              {column.map(([serviceName, serviceConfig]) => (
                <ServiceItem
                  key={serviceName}
                  serviceName={serviceName}
                  serviceConfig={serviceConfig}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-secondary">
          <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2 text-secondary">
            No Services Enabled
          </h3>
          <p className="text-sm">
            Enable services to see their configuration details here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServicesList;
