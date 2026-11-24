// Wizard step definitions: id, stepper title and line, and the page description
// under the step's h1.
export const STEP_DEFS = {
  basic: {
    id: "basic",
    title: "Basics",
    description: "Name, region, git",
    summary:
      "Name the environment, pick where it runs and where its code goes.",
  },
  services: {
    id: "services",
    title: "Services",
    description: "AWS services to provision",
    summary:
      "AWS services OpenPrime provisions. Enable a service to configure it.",
  },
  helm: {
    id: "helm",
    title: "Helm charts",
    description: "Apps on your EKS cluster",
    summary: "Apps installed on your EKS cluster. Everything here is optional.",
  },
  review: {
    id: "review",
    title: "Review",
    description: "Check and create",
    summary:
      "Check the configuration. Nothing is deployed until you generate or push code from the environment page.",
  },
};
