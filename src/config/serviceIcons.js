// Maps service keys to Lucide icon components (SVG — no emoji, per UI/UX conventions).
// Shared by the wizard service list and the environment detail service cards.
import {
  Network,
  Container,
  Database,
  Search,
  Package,
  Zap,
  Radio,
  Shield,
  MessageSquare,
  Bell,
  Globe,
  Activity,
  ScrollText,
  HardDrive,
  Archive,
  Box,
  Lock,
  Key,
  Boxes,
} from "lucide-react";

const SERVICE_ICONS = {
  // Networking
  vpc: Network,
  vnet: Network,
  networking: Network,
  alb: Network,
  // Kubernetes / containers
  eks: Container,
  gke: Container,
  aks: Container,
  kubernetes: Container,
  ecr: Package,
  // Databases
  rds: Database,
  aurora: Database,
  sqlDatabase: Database,
  cloudSql: Database,
  opensearch: Search,
  elasticache: Boxes,
  // Compute / streaming
  lambda: Zap,
  msk: Radio,
  // Security
  waf: Shield,
  iam: Shield,
  secretsmanager: Lock,
  kms: Key,
  // Messaging
  sqs: MessageSquare,
  sns: Bell,
  // Edge / DNS
  cloudfront: Globe,
  route53: Globe,
  externalDns: Globe,
  // Storage
  storage: HardDrive,
  efs: HardDrive,
  s3: Archive,
  // Observability
  monitoring: Activity,
  logging: ScrollText,
  cloudtrail: ScrollText,
};

export const getServiceIcon = (serviceName) =>
  SERVICE_ICONS[serviceName] || Box;
