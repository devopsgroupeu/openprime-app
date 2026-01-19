// src/config/helmChartsConfig.js

// enabled: controls whether chart is available for selection (false = greyed out in UI)
// implicit: if true, chart is always enabled automatically and hidden from UI
export const HELM_CHARTS_CONFIG = {
  prometheusStack: {
    name: "prometheusStack",
    displayName: "Prometheus Stack",
    description: "Complete monitoring solution with Prometheus, Grafana, and Alertmanager",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: true,
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
    defaultEnabled: true,
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
    defaultEnabled: true,
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
  thanos: {
    name: "thanos",
    displayName: "Thanos",
    description: "Long-term metrics storage for Prometheus",
    category: "Monitoring",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "bitnami",
    chart: "thanos",
    version: "17.2.1",
    namespace: "monitoring",
    localPath: "observability/bitnami/thanos",
  },
  ingressNginx: {
    name: "ingressNginx",
    displayName: "Ingress NGINX Controller",
    description: "NGINX-based ingress controller",
    category: "Networking",
    enabled: true,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: true,
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
    defaultEnabled: true,
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
    defaultEnabled: true,
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
    defaultEnabled: true,
    defaultCustomValues: false,
    repository: "eks-charts",
    chart: "aws-load-balancer-controller",
    version: "1.13.2",
    namespace: "kube-system",
  },
  // Disabled charts - not currently in openprime-infra-templates
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
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "kubernetes-sigs",
    chart: "external-dns",
    version: "1.12.0",
    namespace: "external-dns",
  },
  istio: {
    name: "istio",
    displayName: "Istio",
    description: "Service mesh platform",
    category: "Networking",
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "istio",
    chart: "istiod",
    version: "1.16.1",
    namespace: "istio-system",
  },
  fluxcd: {
    name: "fluxcd",
    displayName: "FluxCD",
    description: "GitOps toolkit for Kubernetes",
    category: "CI/CD",
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "fluxcd-community",
    chart: "flux2",
    version: "2.7.0",
    namespace: "flux-system",
  },
  velero: {
    name: "velero",
    displayName: "Velero",
    description: "Backup and disaster recovery",
    category: "Infrastructure",
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "vmware-tanzu",
    chart: "velero",
    version: "3.1.6",
    namespace: "velero",
  },
  falco: {
    name: "falco",
    displayName: "Falco",
    description: "Runtime security monitoring",
    category: "Security",
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "falcosecurity",
    chart: "falco",
    version: "2.4.0",
    namespace: "falco",
  },
  trivyOperator: {
    name: "trivyOperator",
    displayName: "Trivy Operator",
    description: "Vulnerability scanning operator",
    category: "Security",
    enabled: false,
    k8sServices: ["eks", "aks", "gke", "kubernetes"],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "aqua",
    chart: "trivy-operator",
    version: "0.12.1",
    namespace: "trivy-system",
  },
  clusterAutoscaler: {
    name: "clusterAutoscaler",
    displayName: "Cluster Autoscaler",
    description: "Automatically adjusts cluster size",
    category: "Infrastructure",
    enabled: false,
    k8sServices: ["aks", "gke"], // Not needed for EKS as it uses Karpenter
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: "autoscaler",
    chart: "cluster-autoscaler",
    version: "9.21.0",
    namespace: "kube-system",
  },
  metricsServer: {
    name: "metricsServer",
    displayName: "Metrics Server",
    description: "Resource metrics API for autoscaling",
    category: "Monitoring",
    enabled: false,
    k8sServices: ["gke", "kubernetes"], // EKS and AKS have this built-in
    defaultEnabled: true,
    defaultCustomValues: false,
    repository: "metrics-server",
    chart: "metrics-server",
    version: "3.8.3",
    namespace: "kube-system",
  },
};

// Helper functions
export const getHelmChartsForK8sService = (k8sServiceName, includeImplicit = false) => {
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
    return chart.k8sServices.includes(k8sServiceName) && chart.implicit === true;
  });
};
