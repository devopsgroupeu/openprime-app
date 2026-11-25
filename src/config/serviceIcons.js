// Maps service keys to Lucide icon components (SVG, no emoji, per UI/UX conventions).
// Fallback for ServiceIcon when a service has no official AWS icon; services
// with one are resolved by ServiceIcon before this map is read.
import {
  Network,
  Container,
  Database,
  Shield,
  Globe,
  Activity,
  ScrollText,
  HardDrive,
  Box,
  Lock,
  Key,
} from "lucide-react";

const SERVICE_ICONS = {
  // Networking
  vnet: Network,
  networking: Network,
  alb: Network,
  // Kubernetes / containers
  gke: Container,
  aks: Container,
  kubernetes: Container,
  // Databases
  sqlDatabase: Database,
  cloudSql: Database,
  // Security
  iam: Shield,
  secretsmanager: Lock,
  kms: Key,
  // Edge / DNS
  externalDns: Globe,
  // Storage
  storage: HardDrive,
  efs: HardDrive,
  // Observability
  monitoring: Activity,
  logging: ScrollText,
  cloudtrail: ScrollText,
};

export const getServiceIcon = (serviceName) =>
  Object.hasOwn(SERVICE_ICONS, serviceName) ? SERVICE_ICONS[serviceName] : Box;
