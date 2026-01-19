// src/config/providersConfig.js
import { SERVICES_CONFIG } from "./servicesConfig";

export const PROVIDERS_CONFIG = {
  aws: {
    name: "Amazon Web Services",
    type: "aws",
    enabled: true,
    defaultRegion: "us-east-1",
    regions: [
      { value: "us-east-1", label: "US East (N. Virginia)" },
      { value: "us-west-1", label: "US West (N. California)" },
      { value: "us-west-2", label: "US West (Oregon)" },
      { value: "eu-west-1", label: "EU (Ireland)" },
      { value: "eu-west-2", label: "EU (London)" },
      { value: "eu-central-1", label: "EU (Frankfurt)" },
      { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
      { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
      { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
      { value: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
      { value: "ca-central-1", label: "Canada (Central)" },
      { value: "sa-east-1", label: "South America (São Paulo)" },
    ],
  },
  // azure: {
  //   name: 'Microsoft Azure',
  //   type: 'azure',
  //   enabled: false,
  //   defaultRegion: 'East US',
  //   regions: [
  //     { value: 'East US', label: 'East US' },
  //     { value: 'East US 2', label: 'East US 2' },
  //     { value: 'West US', label: 'West US' },
  //     { value: 'West US 2', label: 'West US 2' },
  //     { value: 'West US 3', label: 'West US 3' },
  //     { value: 'Central US', label: 'Central US' },
  //     { value: 'North Central US', label: 'North Central US' },
  //     { value: 'South Central US', label: 'South Central US' },
  //     { value: 'West Europe', label: 'West Europe' },
  //     { value: 'North Europe', label: 'North Europe' },
  //     { value: 'UK South', label: 'UK South' },
  //     { value: 'UK West', label: 'UK West' },
  //     { value: 'Southeast Asia', label: 'Southeast Asia' },
  //     { value: 'East Asia', label: 'East Asia' },
  //     { value: 'Japan East', label: 'Japan East' },
  //     { value: 'Japan West', label: 'Japan West' },
  //     { value: 'Australia East', label: 'Australia East' },
  //     { value: 'Australia Southeast', label: 'Australia Southeast' }
  //   ]
  // },
  // gcp: {
  //   name: 'Google Cloud Platform',
  //   type: 'gcp',
  //   enabled: false,
  //   defaultRegion: 'us-central1',
  //   regions: [
  //     { value: 'us-central1', label: 'US Central (Iowa)' },
  //     { value: 'us-east1', label: 'US East (South Carolina)' },
  //     { value: 'us-east4', label: 'US East (Northern Virginia)' },
  //     { value: 'us-west1', label: 'US West (Oregon)' },
  //     { value: 'us-west2', label: 'US West (Los Angeles)' },
  //     { value: 'us-west3', label: 'US West (Salt Lake City)' },
  //     { value: 'us-west4', label: 'US West (Las Vegas)' },
  //     { value: 'europe-west1', label: 'Europe West (Belgium)' },
  //     { value: 'europe-west2', label: 'Europe West (London)' },
  //     { value: 'europe-west3', label: 'Europe West (Frankfurt)' },
  //     { value: 'europe-west4', label: 'Europe West (Netherlands)' },
  //     { value: 'asia-east1', label: 'Asia East (Taiwan)' },
  //     { value: 'asia-northeast1', label: 'Asia Northeast (Tokyo)' },
  //     { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' }
  //   ]
  // },
  onpremise: {
    name: "On-Premise",
    type: "onpremise",
    enabled: true,
    defaultRegion: "datacenter-1",
    regions: [
      { value: "datacenter-1", label: "Datacenter 1" },
      { value: "datacenter-2", label: "Datacenter 2" },
      { value: "edge-location-1", label: "Edge Location 1" },
      { value: "edge-location-2", label: "Edge Location 2" },
    ],
  },
};

export const getProviderConfig = (providerType) => {
  return PROVIDERS_CONFIG[providerType] || PROVIDERS_CONFIG.aws;
};

export const getAllProviders = () => {
  return Object.keys(PROVIDERS_CONFIG).map((key) => ({
    value: key,
    label: PROVIDERS_CONFIG[key].name,
    ...PROVIDERS_CONFIG[key],
  }));
};

export const getProviderRegions = (providerType) => {
  const provider = getProviderConfig(providerType);
  return provider.regions;
};

export const getProviderServices = (providerType) => {
  // Dynamically filter services based on the provider field in servicesConfig
  return Object.keys(SERVICES_CONFIG).filter((serviceKey) => {
    const service = SERVICES_CONFIG[serviceKey];
    return service.provider === providerType;
  });
};
