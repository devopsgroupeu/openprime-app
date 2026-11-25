// src/components/DynamicServicesGrid.js
// The services of the wizard, grouped by their catalog category (in catalog
// order), one divided card per group.
import { getServiceConfig } from "../config/servicesConfig";
import { SERVICE_PREREQUISITES } from "../utils/configValidator";
import DynamicServiceConfig from "./DynamicServiceConfig";
import { SettingsSection } from "@/components/shared/settings";

/** `[[category, [serviceName, ...]], ...]` in the order the names come. */
export const groupByCategory = (serviceNames) => {
  const groups = new Map();
  for (const name of serviceNames) {
    const category = getServiceConfig(name)?.category || "Other";
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

  const handleToggleExpanded = (serviceName) => {
    setExpandedServices({
      ...expandedServices,
      [serviceName]: !expandedServices[serviceName],
    });
  };

  // "Needs VPC" on an enabled service whose prerequisite is off.
  const missingPrerequisite = (serviceName) => {
    const required = SERVICE_PREREQUISITES[serviceName];
    return required &&
      newEnv.services[serviceName]?.enabled &&
      !newEnv.services[required]?.enabled
      ? required.toUpperCase()
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
                onToggleExpanded={() => handleToggleExpanded(serviceName)}
                onAskAI={onAskAI}
                missingPrerequisite={missingPrerequisite(serviceName)}
              />
            ))}
          </ul>
        </SettingsSection>
      ))}
    </div>
  );
};

export default DynamicServicesGrid;
