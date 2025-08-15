import React from 'react';
import {
  Network, Box, Database, Container, Archive, FunctionSquare,
  HardDrive, MessageSquare, Plus, Package
} from 'lucide-react';
import { helmChartDefaults } from '../../config/environmentsConfig';
import ServiceConfiguration from '../shared/ServiceConfiguration';

const AzureServicesGrid = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onEditHelmValues
}) => {
  const addContainerRepository = () => {
    const newRepo = { name: '', sku: 'Basic' };
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        containerRegistry: {
          ...newEnv.services.containerRegistry,
          repositories: [...(newEnv.services.containerRegistry.repositories || []), newRepo]
        }
      }
    });
  };

  const removeContainerRepository = (index) => {
    const repos = [...newEnv.services.containerRegistry.repositories];
    repos.splice(index, 1);
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        containerRegistry: { ...newEnv.services.containerRegistry, repositories: repos }
      }
    });
  };

  const addStorageContainer = () => {
    const newContainer = {
      name: '',
      accessType: 'private',
      enableVersioning: false
    };
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        storageAccount: {
          ...newEnv.services.storageAccount,
          containers: [...(newEnv.services.storageAccount.containers || []), newContainer]
        }
      }
    });
  };

  const removeStorageContainer = (index) => {
    const containers = [...newEnv.services.storageAccount.containers];
    containers.splice(index, 1);
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        storageAccount: { ...newEnv.services.storageAccount, containers }
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Column 1 - Core Services */}
      <div className="space-y-3">
        {/* VNet Configuration */}
        <ServiceConfiguration
          service="vnet"
          icon={<Network className="w-5 h-5 text-purple-400 mr-2" />}
          title="VNet - Virtual Network"
          enabled={newEnv.services.vnet?.enabled}
          expanded={expandedServices.vnet}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vnet: {...newEnv.services.vnet, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, vnet: !expandedServices.vnet})}
        >
          <AzureVNetSettings newEnv={newEnv} setNewEnv={setNewEnv} />
        </ServiceConfiguration>

        {/* AKS Configuration */}
        <ServiceConfiguration
          service="aks"
          icon={<Box className="w-5 h-5 text-purple-400 mr-2" />}
          title="AKS - Azure Kubernetes Service"
          enabled={newEnv.services.aks?.enabled}
          expanded={expandedServices.aks}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, aks: {...newEnv.services.aks, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, aks: !expandedServices.aks})}
        >
          <AzureAKSSettings
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            onEditHelmValues={onEditHelmValues}
          />
        </ServiceConfiguration>

        {/* SQL Database Configuration */}
        <ServiceConfiguration
          service="sqlDatabase"
          icon={<Database className="w-5 h-5 text-purple-400 mr-2" />}
          title="SQL Database"
          enabled={newEnv.services.sqlDatabase?.enabled}
          expanded={expandedServices.sqlDatabase}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, sqlDatabase: {...newEnv.services.sqlDatabase, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, sqlDatabase: !expandedServices.sqlDatabase})}
        >
          <AzureSQLSettings newEnv={newEnv} setNewEnv={setNewEnv} />
        </ServiceConfiguration>

        {/* Container Registry Configuration */}
        <ServiceConfiguration
          service="containerRegistry"
          icon={<Container className="w-5 h-5 text-purple-400 mr-2" />}
          title="Container Registry"
          enabled={newEnv.services.containerRegistry?.enabled}
          expanded={expandedServices.containerRegistry}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, containerRegistry: {...newEnv.services.containerRegistry, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, containerRegistry: !expandedServices.containerRegistry})}
        >
          <AzureContainerRegistrySettings
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            addRepository={addContainerRepository}
            removeRepository={removeContainerRepository}
          />
        </ServiceConfiguration>
      </div>

      {/* Column 2 - Additional Services */}
      <div className="space-y-3">
        {/* Storage Account Configuration */}
        <ServiceConfiguration
          service="storageAccount"
          icon={<Archive className="w-5 h-5 text-purple-400 mr-2" />}
          title="Storage Account"
          enabled={newEnv.services.storageAccount?.enabled}
          expanded={expandedServices.storageAccount}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, storageAccount: {...newEnv.services.storageAccount, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, storageAccount: !expandedServices.storageAccount})}
        >
          <AzureStorageSettings
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            addContainer={addStorageContainer}
            removeContainer={removeStorageContainer}
          />
        </ServiceConfiguration>

        {/* Azure Functions Configuration */}
        <ServiceConfiguration
          service="functions"
          icon={<FunctionSquare className="w-5 h-5 text-purple-400 mr-2" />}
          title="Azure Functions"
          enabled={newEnv.services.functions?.enabled}
          expanded={expandedServices.functions}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, functions: {...newEnv.services.functions, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, functions: !expandedServices.functions})}
        >
          <AzureFunctionsSettings newEnv={newEnv} setNewEnv={setNewEnv} />
        </ServiceConfiguration>

        {/* Redis Cache Configuration */}
        <ServiceConfiguration
          service="redis"
          icon={<HardDrive className="w-5 h-5 text-purple-400 mr-2" />}
          title="Azure Cache for Redis"
          enabled={newEnv.services.redis?.enabled}
          expanded={expandedServices.redis}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, redis: {...newEnv.services.redis, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, redis: !expandedServices.redis})}
        >
          <AzureRedisSettings newEnv={newEnv} setNewEnv={setNewEnv} />
        </ServiceConfiguration>

        {/* Service Bus Configuration */}
        <ServiceConfiguration
          service="serviceBus"
          icon={<MessageSquare className="w-5 h-5 text-purple-400 mr-2" />}
          title="Service Bus"
          enabled={newEnv.services.serviceBus?.enabled}
          expanded={expandedServices.serviceBus}
          onToggle={(checked) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, serviceBus: {...newEnv.services.serviceBus, enabled: checked}}
          })}
          onExpand={() => setExpandedServices({...expandedServices, serviceBus: !expandedServices.serviceBus})}
        >
          <AzureServiceBusSettings newEnv={newEnv} setNewEnv={setNewEnv} />
        </ServiceConfiguration>
      </div>
    </div>
  );
};

// Azure VNet Settings Component
const AzureVNetSettings = ({ newEnv, setNewEnv }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Address Space</label>
        <input
          type="text"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vnet?.addressSpace || '10.0.0.0/16'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vnet: {...newEnv.services.vnet, addressSpace: e.target.value}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Public Subnet CIDR</label>
        <input
          type="text"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vnet?.subnets?.public?.cidr || '10.0.1.0/24'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {
              ...newEnv.services,
              vnet: {
                ...newEnv.services.vnet,
                subnets: {
                  ...newEnv.services.vnet.subnets,
                  public: { ...newEnv.services.vnet.subnets.public, cidr: e.target.value }
                }
              }
            }
          })}
        />
      </div>
    </div>
    <div className="space-y-2">
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.vnet?.enableDdosProtection || false}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vnet: {...newEnv.services.vnet, enableDdosProtection: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Enable DDoS Protection</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.vnet?.enableVmProtection || false}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vnet: {...newEnv.services.vnet, enableVmProtection: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Enable VM Protection</span>
      </label>
    </div>
  </div>
);

// Azure AKS Settings Component
const AzureAKSSettings = ({ newEnv, setNewEnv, onEditHelmValues }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Version</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.aks?.version || '1.28'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, aks: {...newEnv.services.aks, version: e.target.value}}
          })}
        >
          <option value="1.28">1.28</option>
          <option value="1.27">1.27</option>
          <option value="1.26">1.26</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">VM Size</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.aks?.vmSize || 'Standard_D2s_v3'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, aks: {...newEnv.services.aks, vmSize: e.target.value}}
          })}
        >
          <option value="Standard_D2s_v3">Standard_D2s_v3</option>
          <option value="Standard_D4s_v3">Standard_D4s_v3</option>
          <option value="Standard_D8s_v3">Standard_D8s_v3</option>
        </select>
      </div>
    </div>

    {/* AKS Addons */}
    <div>
      <div className="text-sm text-gray-300 font-medium mb-2">AKS Addons</div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(newEnv.services.aks?.addons || {}).map(([addon, config]) => (
          <label key={addon} className="flex items-center text-xs">
            <input
              type="checkbox"
              className="mr-2 w-3 h-3"
              checked={config.enabled || false}
              onChange={(e) => setNewEnv({
                ...newEnv,
                services: {
                  ...newEnv.services,
                  aks: {
                    ...newEnv.services.aks,
                    addons: {
                      ...newEnv.services.aks?.addons,
                      [addon]: { ...config, enabled: e.target.checked }
                    }
                  }
                }
              })}
            />
            <span className="text-gray-300 capitalize">
              {addon.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </label>
        ))}
      </div>
    </div>

    {/* Helm Charts */}
    <div>
      <div className="text-sm text-gray-300 font-medium mb-2">Helm Charts</div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {Object.entries(newEnv.services.aks?.helmCharts || {}).map(([chart, config]) => (
          <div key={chart} className="flex items-center justify-between bg-gray-600 rounded px-2 py-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2 w-3 h-3"
                checked={config.enabled}
                onChange={(e) => setNewEnv({
                  ...newEnv,
                  services: {
                    ...newEnv.services,
                    aks: {
                      ...newEnv.services.aks,
                      helmCharts: {
                        ...newEnv.services.aks?.helmCharts,
                        [chart]: {...config, enabled: e.target.checked}
                      }
                    }
                  }
                })}
              />
              <Package className="w-3 h-3 text-green-400 mr-1" />
              <span className="text-white text-xs capitalize">{chart}</span>
            </div>
            {config.enabled && (
              <button
                type="button"
                onClick={() => onEditHelmValues(chart, helmChartDefaults[chart] || '')}
                className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Azure SQL Settings Component
const AzureSQLSettings = ({ newEnv, setNewEnv }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Tier</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.sqlDatabase?.tier || 'Basic'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, sqlDatabase: {...newEnv.services.sqlDatabase, tier: e.target.value}}
          })}
        >
          <option value="Basic">Basic</option>
          <option value="Standard">Standard</option>
          <option value="Premium">Premium</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Size</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.sqlDatabase?.size || 'S0'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, sqlDatabase: {...newEnv.services.sqlDatabase, size: e.target.value}}
          })}
        >
          <option value="S0">S0</option>
          <option value="S1">S1</option>
          <option value="S2">S2</option>
        </select>
      </div>
    </div>
  </div>
);

// Azure Container Registry Settings Component
const AzureContainerRegistrySettings = ({ newEnv, setNewEnv, addRepository, removeRepository }) => (
  <div className="space-y-3 mt-3">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-300 font-medium">Repositories</div>
      <button
        type="button"
        onClick={addRepository}
        className="px-2 py-1 bg-purple-600/30 text-purple-400 rounded text-xs hover:bg-purple-600/50 flex items-center"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Repository
      </button>
    </div>
  </div>
);

// Azure Storage Settings Component
const AzureStorageSettings = ({ newEnv, setNewEnv, addContainer, removeContainer }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Account Type</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.storageAccount?.accountType || 'Standard_LRS'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, storageAccount: {...newEnv.services.storageAccount, accountType: e.target.value}}
          })}
        >
          <option value="Standard_LRS">Standard_LRS</option>
          <option value="Standard_GRS">Standard_GRS</option>
          <option value="Premium_LRS">Premium_LRS</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Access Tier</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.storageAccount?.accessTier || 'Hot'}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, storageAccount: {...newEnv.services.storageAccount, accessTier: e.target.value}}
          })}
        >
          <option value="Hot">Hot</option>
          <option value="Cool">Cool</option>
          <option value="Archive">Archive</option>
        </select>
      </div>
    </div>
  </div>
);

// Azure Functions Settings Component
const AzureFunctionsSettings = ({ newEnv, setNewEnv }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs text-gray-400 mb-1">Plan</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.functions?.plan || 'Consumption'}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, functions: {...newEnv.services.functions, plan: e.target.value}}
        })}
      >
        <option value="Consumption">Consumption</option>
        <option value="Premium">Premium</option>
        <option value="Dedicated">Dedicated</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Runtime</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.functions?.runtime || 'dotnet'}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, functions: {...newEnv.services.functions, runtime: e.target.value}}
        })}
      >
        <option value="dotnet">C# (.NET)</option>
        <option value="node">Node.js</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>
    </div>
  </div>
);

// Azure Redis Settings Component
const AzureRedisSettings = ({ newEnv, setNewEnv }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs text-gray-400 mb-1">SKU</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.redis?.sku || 'Basic'}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, redis: {...newEnv.services.redis, sku: e.target.value}}
        })}
      >
        <option value="Basic">Basic</option>
        <option value="Standard">Standard</option>
        <option value="Premium">Premium</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Capacity</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.redis?.capacity || 0}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, redis: {...newEnv.services.redis, capacity: parseInt(e.target.value)}}
        })}
      >
        <option value={0}>C0 (250 MB)</option>
        <option value={1}>C1 (1 GB)</option>
        <option value={2}>C2 (2.5 GB)</option>
      </select>
    </div>
  </div>
);

// Azure Service Bus Settings Component
const AzureServiceBusSettings = ({ newEnv, setNewEnv }) => (
  <div className="mt-3">
    <label className="block text-xs text-gray-400 mb-1">SKU</label>
    <select
      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
      value={newEnv.services.serviceBus?.sku || 'Basic'}
      onChange={(e) => setNewEnv({
        ...newEnv,
        services: {...newEnv.services, serviceBus: {...newEnv.services.serviceBus, sku: e.target.value}}
      })}
    >
      <option value="Basic">Basic</option>
      <option value="Standard">Standard</option>
      <option value="Premium">Premium</option>
    </select>
  </div>
);

export default AzureServicesGrid;
