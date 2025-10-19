// src/config/helmChartsConfig.js

export const HELM_CHARTS_CONFIG = {
  prometheus: {
    name: 'prometheus',
    displayName: 'Prometheus',
    description: 'Monitoring and alerting toolkit',
    category: 'Monitoring',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'prometheus-community',
    chart: 'kube-prometheus-stack',
    version: '45.7.1',
    namespace: 'monitoring'
  },
  grafana: {
    name: 'grafana',
    displayName: 'Grafana',
    description: 'Observability and data visualization platform',
    category: 'Monitoring',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: true,
    repository: 'grafana',
    chart: 'grafana',
    version: '6.50.7',
    namespace: 'monitoring'
  },
  argocd: {
    name: 'argocd',
    displayName: 'ArgoCD',
    description: 'GitOps continuous delivery tool',
    category: 'CI/CD',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'argo',
    chart: 'argo-cd',
    version: '5.19.14',
    namespace: 'argocd'
  },
  loki: {
    name: 'loki',
    displayName: 'Loki',
    description: 'Log aggregation system',
    category: 'Monitoring',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'grafana',
    chart: 'loki-stack',
    version: '2.9.9',
    namespace: 'monitoring'
  },
  karpenter: {
    name: 'karpenter',
    displayName: 'Karpenter',
    description: 'Node provisioning and lifecycle management',
    category: 'Infrastructure',
    k8sServices: ['eks'], // AWS EKS specific
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'karpenter',
    chart: 'karpenter',
    version: '0.21.1',
    namespace: 'karpenter'
  },
  certManager: {
    name: 'certManager',
    displayName: 'Cert-Manager',
    description: 'Certificate management controller',
    category: 'Security',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'jetstack',
    chart: 'cert-manager',
    version: '1.11.0',
    namespace: 'cert-manager'
  },
  externalDns: {
    name: 'externalDns',
    displayName: 'External DNS',
    description: 'DNS record management for Kubernetes',
    category: 'Networking',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'kubernetes-sigs',
    chart: 'external-dns',
    version: '1.12.0',
    namespace: 'external-dns'
  },
  istio: {
    name: 'istio',
    displayName: 'Istio',
    description: 'Service mesh platform',
    category: 'Networking',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'istio',
    chart: 'istiod',
    version: '1.16.1',
    namespace: 'istio-system'
  },
  fluxcd: {
    name: 'fluxcd',
    displayName: 'FluxCD',
    description: 'GitOps toolkit for Kubernetes',
    category: 'CI/CD',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'fluxcd-community',
    chart: 'flux2',
    version: '2.7.0',
    namespace: 'flux-system'
  },
  velero: {
    name: 'velero',
    displayName: 'Velero',
    description: 'Backup and disaster recovery',
    category: 'Infrastructure',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'vmware-tanzu',
    chart: 'velero',
    version: '3.1.6',
    namespace: 'velero'
  },
  falco: {
    name: 'falco',
    displayName: 'Falco',
    description: 'Runtime security monitoring',
    category: 'Security',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'falcosecurity',
    chart: 'falco',
    version: '2.4.0',
    namespace: 'falco'
  },
  trivyOperator: {
    name: 'trivyOperator',
    displayName: 'Trivy Operator',
    description: 'Vulnerability scanning operator',
    category: 'Security',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'aqua',
    chart: 'trivy-operator',
    version: '0.12.1',
    namespace: 'trivy-system'
  },
  clusterAutoscaler: {
    name: 'clusterAutoscaler',
    displayName: 'Cluster Autoscaler',
    description: 'Automatically adjusts cluster size',
    category: 'Infrastructure',
    k8sServices: ['aks', 'gke'], // Not needed for EKS as it uses Karpenter
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'autoscaler',
    chart: 'cluster-autoscaler',
    version: '9.21.0',
    namespace: 'kube-system'
  },
  ingressNginx: {
    name: 'ingressNginx',
    displayName: 'Ingress NGINX Controller',
    description: 'NGINX-based ingress controller',
    category: 'Networking',
    k8sServices: ['eks', 'aks', 'gke', 'kubernetes'],
    defaultEnabled: false,
    defaultCustomValues: false,
    repository: 'ingress-nginx',
    chart: 'ingress-nginx',
    version: '4.4.2',
    namespace: 'ingress-nginx'
  },
  metricsServer: {
    name: 'metricsServer',
    displayName: 'Metrics Server',
    description: 'Resource metrics API for autoscaling',
    category: 'Monitoring',
    k8sServices: ['gke', 'kubernetes'], // EKS and AKS have this built-in
    defaultEnabled: true,
    defaultCustomValues: false,
    repository: 'metrics-server',
    chart: 'metrics-server',
    version: '3.8.3',
    namespace: 'kube-system'
  }
};

// Helper functions
export const getHelmChartsForK8sService = (k8sServiceName) => {
  return Object.keys(HELM_CHARTS_CONFIG).filter(chartKey => {
    const chart = HELM_CHARTS_CONFIG[chartKey];
    return chart.k8sServices.includes(k8sServiceName);
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
      customValues: chart.defaultCustomValues
    };
    return acc;
  }, {});
};

export const getAllCategories = () => {
  const categories = new Set();
  Object.values(HELM_CHARTS_CONFIG).forEach(chart => {
    categories.add(chart.category);
  });
  return Array.from(categories);
};
