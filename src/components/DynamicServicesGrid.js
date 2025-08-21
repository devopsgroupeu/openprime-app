// src/components/DynamicServicesGrid.js
import React from 'react';
import { getProviderServices } from '../config/providersConfig';
import DynamicServiceConfig from './DynamicServiceConfig';

const DynamicServicesGrid = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onEditHelmValues,
  onAskAI
}) => {
  const providerServices = getProviderServices(newEnv.type);

  const handleServiceChange = (serviceName, newServiceConfig) => {
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [serviceName]: newServiceConfig
      }
    });
  };

  const handleToggleExpanded = (serviceName) => {
    setExpandedServices({
      ...expandedServices,
      [serviceName]: !expandedServices[serviceName]
    });
  };

  return (
    <div className="space-y-3">
      {providerServices.map(serviceName => {
        const serviceConfig = newEnv.services[serviceName];
        if (!serviceConfig) return null;

        return (
          <DynamicServiceConfig
            key={serviceName}
            serviceName={serviceName}
            serviceConfig={serviceConfig}
            onServiceChange={handleServiceChange}
            expanded={expandedServices[serviceName]}
            onToggleExpanded={() => handleToggleExpanded(serviceName)}
            onEditHelmValues={onEditHelmValues}
            onAskAI={onAskAI}
          />
        );
      })}
    </div>
  );
};

export default DynamicServicesGrid;
