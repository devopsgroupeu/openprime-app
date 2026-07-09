// src/config/helmChartsConfig.js

// enabled: controls whether chart is available for selection (false = greyed out in UI)
// implicit: if true, chart is always enabled automatically and hidden from UI
export const HELM_CHARTS_CONFIG = {
  prometheusStack: {
    name: "prometheusStack",
    displayName: "Prometheus Stack",
    description:
      "Complete monitoring solution with Prometheus, Grafana, and Alertmanager",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "prometheus-community",
    chart: "kube-prometheus-stack",
    version: "75.9.0",
    namespace: "monitoring",
    localPath: "observability/prometheus-community/kube-prometheus-stack",
  },
  loki: {
    name: "loki",
    displayName: "Loki",
    description: "Log aggregation system with S3 backend support",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: true,
    repository: "grafana",
    chart: "loki",
    version: "6.30.1",
    namespace: "monitoring",
    localPath: "observability/grafana/loki",
  },
  promtail: {
    name: "promtail",
    displayName: "Promtail",
    description: "Log collector agent for Loki",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "grafana",
    chart: "promtail",
    version: "6.17.0",
    namespace: "monitoring",
    localPath: "observability/grafana/promtail",
  },
  tempo: {
    name: "tempo",
    displayName: "Tempo Distributed",
    description: "Distributed tracing backend",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "grafana",
    chart: "tempo-distributed",
    version: "1.45.0",
    namespace: "monitoring",
    localPath: "observability/grafana/tempo-distributed",
  },
  ingressNginx: {
    name: "ingressNginx",
    displayName: "Ingress NGINX Controller",
    description: "NGINX-based ingress controller",
    category: "Networking",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "ingress-nginx",
    chart: "ingress-nginx",
    version: "4.13.0",
    namespace: "ingress-nginx",
    localPath: "ingress/ingress-nginx",
  },
  certManager: {
    name: "certManager",
    displayName: "Cert-Manager",
    description: "Certificate management controller with Route53 DNS01 support",
    category: "Security",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "jetstack",
    chart: "cert-manager",
    version: "1.18.2",
    namespace: "cert-manager",
    localPath: "cert-manager/cert-manager",
  },
  karpenter: {
    name: "karpenter",
    displayName: "Karpenter",
    description: "Node provisioning and lifecycle management for AWS",
    category: "Infrastructure",
    enabled: true,
    implicit: true, // Always enabled for EKS, hidden from UI
    k8sServices: ["eks"], // AWS EKS specific
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "public.ecr.aws",
    chart: "karpenter/karpenter",
    version: "1.4.0",
    namespace: "kube-system",
  },
  awsLoadBalancerController: {
    name: "awsLoadBalancerController",
    displayName: "AWS Load Balancer Controller",
    description: "AWS ALB/NLB management for Kubernetes",
    category: "Networking",
    enabled: true,
    k8sServices: ["eks"], // AWS EKS specific
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "eks-charts",
    chart: "aws-load-balancer-controller",
    version: "1.13.2",
    namespace: "kube-system",
  },
  // Implicit charts: bootstrapped via Terraform (argocd.tf / karpenter.tf), hidden from UI
  argocd: {
    name: "argocd",
    displayName: "ArgoCD",
    description: "GitOps continuous delivery tool",
    category: "CI/CD",
    enabled: false,
    implicit: true, // Always enabled for all K8s services, hidden from UI
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "argo",
    chart: "argo-cd",
    version: "5.19.14",
    namespace: "argocd",
  },
  externalDns: {
    name: "externalDns",
    displayName: "External DNS",
    description: "DNS record management for Kubernetes",
    category: "Networking",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: true,
    repository: "kubernetes-sigs",
    chart: "external-dns",
    version: "1.20.0",
    namespace: "external-dns",
  },
};

// Helper functions
export const getHelmChartsForK8sService = (
  k8sServiceName,
  includeImplicit = false,
) => {
  return Object.keys(HELM_CHARTS_CONFIG).filter((chartKey) => {
    const chart = HELM_CHARTS_CONFIG[chartKey];
    const isAvailableForService = chart.k8sServices.includes(k8sServiceName);
    // Exclude implicit charts unless explicitly requested
    return isAvailableForService && (includeImplicit || !chart.implicit);
  });
};

export const getHelmChartConfig = (chartName) => {
  return HELM_CHARTS_CONFIG[chartName] || null;
};

export const getHelmChartsByCategory = (k8sServiceName) => {
  const availableCharts = getHelmChartsForK8sService(k8sServiceName);
  return availableCharts.reduce((acc, chartKey) => {
    const chart = HELM_CHARTS_CONFIG[chartKey];
    if (!acc[chart.category]) acc[chart.category] = [];
    acc[chart.category].push({ key: chartKey, ...chart });
    return acc;
  }, {});
};

export const generateDefaultHelmChartsConfig = (k8sServiceName) => {
  const availableCharts = getHelmChartsForK8sService(k8sServiceName);
  return availableCharts.reduce((acc, chartKey) => {
    const chart = HELM_CHARTS_CONFIG[chartKey];
    acc[chartKey] = {
      enabled: chart.defaultEnabled,
      customValues: chart.defaultCustomValues,
    };
    return acc;
  }, {});
};

export const getAllCategories = () => {
  const categories = new Set();
  Object.values(HELM_CHARTS_CONFIG).forEach((chart) => {
    categories.add(chart.category);
  });
  return Array.from(categories);
};

// Get implicit charts for a specific k8s service
export const getImplicitChartsForK8sService = (k8sServiceName) => {
  return Object.keys(HELM_CHARTS_CONFIG).filter((chartKey) => {
    const chart = HELM_CHARTS_CONFIG[chartKey];
    return (
      chart.k8sServices.includes(k8sServiceName) && chart.implicit === true
    );
  });
};
