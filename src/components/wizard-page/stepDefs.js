import { Settings, Cloud, Package, ClipboardCheck } from "lucide-react";

// Wizard step definitions: id, sidebar title/icon, and description.
export const STEP_DEFS = {
  basic: {
    id: "basic",
    title: "Basic Configuration",
    icon: Settings,
    description: "Environment name and provider",
  },
  services: {
    id: "services",
    title: "Services Configuration",
    icon: Cloud,
    description: "Select and configure services",
  },
  helm: {
    id: "helm",
    title: "Helm Charts",
    icon: Package,
    description: "Configure Kubernetes applications",
  },
  review: {
    id: "review",
    title: "Review",
    icon: ClipboardCheck,
    description: "Review and create your environment",
  },
};
