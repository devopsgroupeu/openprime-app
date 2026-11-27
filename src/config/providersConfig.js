// src/config/providersConfig.js
import { SERVICES_CONFIG } from "./servicesConfig";

export const PROVIDERS_CONFIG = {
  aws: {
    name: "Amazon Web Services",
    // Filter tabs and the services groups.
    shortName: "AWS",
    type: "aws",
    enabled: true,
    defaultRegion: "us-east-1",
    // `city` names the region in short; `at` is its [longitude, latitude] on the region map.
    regions: [
      {
        value: "us-east-1",
        label: "US East (N. Virginia)",
        city: "N. Virginia",
        at: [-77.49, 39.04],
      },
      {
        value: "us-west-1",
        label: "US West (N. California)",
        city: "N. California",
        at: [-121.89, 37.34],
      },
      {
        value: "us-west-2",
        label: "US West (Oregon)",
        city: "Oregon",
        at: [-119.7, 45.84],
      },
      {
        value: "eu-west-1",
        label: "Europe (Ireland)",
        city: "Ireland",
        at: [-6.26, 53.35],
      },
      {
        value: "eu-west-2",
        label: "Europe (London)",
        city: "London",
        at: [-0.13, 51.51],
      },
      {
        value: "eu-central-1",
        label: "Europe (Frankfurt)",
        city: "Frankfurt",
        at: [8.68, 50.11],
      },
      {
        value: "ap-southeast-1",
        label: "Asia Pacific (Singapore)",
        city: "Singapore",
        at: [103.82, 1.35],
      },
      {
        value: "ap-southeast-2",
        label: "Asia Pacific (Sydney)",
        city: "Sydney",
        at: [151.21, -33.87],
      },
      {
        value: "ap-northeast-1",
        label: "Asia Pacific (Tokyo)",
        city: "Tokyo",
        at: [139.69, 35.68],
      },
      {
        value: "ap-northeast-2",
        label: "Asia Pacific (Seoul)",
        city: "Seoul",
        at: [126.98, 37.57],
      },
      {
        value: "ca-central-1",
        label: "Canada (Central)",
        city: "Montreal",
        at: [-73.57, 45.5],
      },
      {
        value: "sa-east-1",
        label: "South America (São Paulo)",
        city: "São Paulo",
        at: [-46.63, -23.55],
      },
    ],
  },
  azure: {
    name: "Microsoft Azure",
    shortName: "Azure",
    type: "azure",
    enabled: false,
    defaultRegion: "East US",
    regions: [
      {
        value: "East US",
        label: "East US",
        city: "Virginia",
        at: [-79.82, 37.37],
      },
      {
        value: "East US 2",
        label: "East US 2",
        city: "Virginia",
        at: [-78.39, 36.67],
      },
      {
        value: "West US",
        label: "West US",
        city: "California",
        at: [-122.42, 37.78],
      },
      {
        value: "West US 2",
        label: "West US 2",
        city: "Washington",
        at: [-119.85, 47.23],
      },
      {
        value: "West US 3",
        label: "West US 3",
        city: "Phoenix",
        at: [-112.07, 33.45],
      },
      {
        value: "Central US",
        label: "Central US",
        city: "Iowa",
        at: [-93.62, 41.59],
      },
      {
        value: "North Central US",
        label: "North Central US",
        city: "Illinois",
        at: [-87.63, 41.88],
      },
      {
        value: "South Central US",
        label: "South Central US",
        city: "Texas",
        at: [-98.5, 29.42],
      },
      {
        value: "West Europe",
        label: "West Europe",
        city: "Netherlands",
        at: [4.9, 52.37],
      },
      {
        value: "North Europe",
        label: "North Europe",
        city: "Ireland",
        at: [-6.26, 53.35],
      },
      {
        value: "UK South",
        label: "UK South",
        city: "London",
        at: [-0.8, 50.94],
      },
      {
        value: "UK West",
        label: "UK West",
        city: "Cardiff",
        at: [-3.08, 53.43],
      },
      {
        value: "Southeast Asia",
        label: "Southeast Asia",
        city: "Singapore",
        at: [103.83, 1.28],
      },
      {
        value: "East Asia",
        label: "East Asia",
        city: "Hong Kong",
        at: [114.19, 22.27],
      },
      {
        value: "Japan East",
        label: "Japan East",
        city: "Tokyo",
        at: [139.77, 35.68],
      },
      {
        value: "Japan West",
        label: "Japan West",
        city: "Osaka",
        at: [135.5, 34.69],
      },
      {
        value: "Australia East",
        label: "Australia East",
        city: "Sydney",
        at: [151.21, -33.86],
      },
      {
        value: "Australia Southeast",
        label: "Australia Southeast",
        city: "Melbourne",
        at: [144.96, -37.81],
      },
    ],
  },
  gcp: {
    name: "Google Cloud Platform",
    shortName: "Google Cloud",
    // The region map legend, which keeps all providers on one line (the
    // others use their short name there).
    legendName: "GCP",
    type: "gcp",
    enabled: false,
    defaultRegion: "us-central1",
    regions: [
      {
        value: "us-central1",
        label: "US Central (Iowa)",
        city: "Iowa",
        at: [-95.86, 41.26],
      },
      {
        value: "us-east1",
        label: "US East (South Carolina)",
        city: "South Carolina",
        at: [-80.01, 33.2],
      },
      {
        value: "us-east4",
        label: "US East (Northern Virginia)",
        city: "N. Virginia",
        at: [-77.49, 39.04],
      },
      {
        value: "us-west1",
        label: "US West (Oregon)",
        city: "Oregon",
        at: [-121.18, 45.6],
      },
      {
        value: "us-west2",
        label: "US West (Los Angeles)",
        city: "Los Angeles",
        at: [-118.24, 34.05],
      },
      {
        value: "us-west3",
        label: "US West (Salt Lake City)",
        city: "Salt Lake City",
        at: [-111.89, 40.76],
      },
      {
        value: "us-west4",
        label: "US West (Las Vegas)",
        city: "Las Vegas",
        at: [-115.14, 36.17],
      },
      {
        value: "europe-west1",
        label: "Europe West (Belgium)",
        city: "Belgium",
        at: [3.82, 50.47],
      },
      {
        value: "europe-west2",
        label: "Europe West (London)",
        city: "London",
        at: [-0.13, 51.51],
      },
      {
        value: "europe-west3",
        label: "Europe West (Frankfurt)",
        city: "Frankfurt",
        at: [8.68, 50.11],
      },
      {
        value: "europe-west4",
        label: "Europe West (Netherlands)",
        city: "Netherlands",
        at: [6.83, 53.44],
      },
      {
        value: "asia-east1",
        label: "Asia East (Taiwan)",
        city: "Taiwan",
        at: [120.54, 24.08],
      },
      {
        value: "asia-northeast1",
        label: "Asia Northeast (Tokyo)",
        city: "Tokyo",
        at: [139.69, 35.69],
      },
      {
        value: "asia-southeast1",
        label: "Asia Southeast (Singapore)",
        city: "Singapore",
        at: [103.7, 1.34],
      },
    ],
  },
  // `enabled: false` keeps the config for existing environments and future
  // re-enabling, but the wizard renders the provider as unselectable. On-premise
  // has no provisioning path: templates/terraform only ships aws and kubernetes.
  onpremise: {
    name: "On-Premise",
    shortName: "On-prem",
    type: "onpremise",
    enabled: false,
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
    // `available: false` hides a service from the wizard while keeping its
    // config (e.g. for existing environments and future re-enabling).
    return service.provider === providerType && service.available !== false;
  });
};
