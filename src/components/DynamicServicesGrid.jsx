// src/components/DynamicServicesGrid.js
// The services of the wizard, grouped by their catalog category (in catalog
// order), one divided card per group.
import { getServiceConfig } from "../config/servicesConfig";
import { SERVICE_PREREQUISITES } from "../utils/configValidator";
import DynamicServiceConfig from "./DynamicServiceConfig";
import { SettingsSection } from "@/components/shared/settings";

/** The catalog category of a service; "Other" when it has none. */
export const categoryOf = (serviceName) =>
  getServiceConfig(serviceName)?.category || "Other";

/** `[[category, [serviceName, ...]], ...]` in the order the names come. */
export const groupByCategory = (serviceNames) => {
  const groups = new Map();
  for (const name of serviceNames) {
    const category = categoryOf(name);
    groups.set(category, [...(groups.get(category) || []), name]);
  }
  return [...groups];
};

const DynamicServicesGrid = ({
  serviceNames,
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onAskAI,
  withProblems,
}) => {
  const handleServiceChange = (serviceName, newServiceConfig) => {
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [serviceName]: newServiceConfig,
      },
    });
  };

  const setExpanded = (serviceName, open) =>
    setExpandedServices({ ...expandedServices, [serviceName]: open });

  // "Needs <service>" on an enabled service whose prerequisite is off.
  const missingPrerequisite = (serviceName) => {
    const required = SERVICE_PREREQUISITES[serviceName];
    return required &&
      newEnv.services[serviceName]?.enabled &&
      !newEnv.services[required]?.enabled
      ? getServiceConfig(required)?.displayName || required
      : null;
  };

  return (
    <div className="flex flex-col gap-8">
      {groupByCategory(serviceNames).map(([category, names]) => (
        <SettingsSection key={category} title={category}>
          <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-border ring-inset">
            {names.map((serviceName) => (
              <DynamicServiceConfig
                key={serviceName}
                serviceName={serviceName}
                serviceConfig={newEnv.services[serviceName]}
                onServiceChange={handleServiceChange}
                expanded={expandedServices[serviceName]}
                onExpandedChange={(open) => setExpanded(serviceName, open)}
                onAskAI={onAskAI}
                missingPrerequisite={missingPrerequisite(serviceName)}
                needsAttention={Boolean(withProblems?.has(serviceName))}
              />
            ))}
          </ul>
        </SettingsSection>
      ))}
    </div>
  );
};

export default DynamicServicesGrid;
