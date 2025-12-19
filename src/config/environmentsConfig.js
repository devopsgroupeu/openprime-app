// src/config/environmentsConfig.js
import { PROVIDERS_CONFIG, getProviderConfig, getProviderServices } from "./providersConfig";
import { createDefaultServiceConfig } from "./servicesConfig";
import { generateDefaultHelmChartsConfig } from "./helmChartsConfig";

// Re-export providers from the new configuration
export const PROVIDERS = PROVIDERS_CONFIG;

export const createEmptyEnvironment = (providerType = "aws") => ({
  name: "",
  globalPrefix: "",
  provider: providerType,
  region: getProviderConfig(providerType).defaultRegion,
  services: createEmptyServices(providerType),
});

const createEmptyServices = (providerType) => {
  const providerServices = getProviderServices(providerType);
  const services = {};

  providerServices.forEach((serviceName) => {
    services[serviceName] = createDefaultServiceConfig(serviceName);

    // Initialize helmCharts for Kubernetes services
    if (["eks", "aks", "gke", "kubernetes"].includes(serviceName)) {
      services[serviceName].helmCharts = generateDefaultHelmChartsConfig(serviceName);
    }
  });

  return services;
};

// Dynamic service creation - no need for hardcoded service functions

export const helmChartDefaults = {
  prometheus: `# Prometheus Values
alertmanager:
  enabled: true
  persistentVolume:
    size: 10Gi
  ingress:
    enabled: true
    className: nginx

server:
  persistentVolume:
    size: 50Gi
  retention: "30d"
  global:
    scrape_interval: 15s
    evaluation_interval: 15s

serviceMonitor:
  enabled: true

prometheusOperator:
  enabled: true
  admissionWebhooks:
    enabled: true`,

  grafana: `# Grafana Values
adminPassword: "admin"
persistence:
  enabled: true
  size: 10Gi

ingress:
  enabled: true
  className: nginx
  hosts:
    - grafana.example.com

datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus-server
      access: proxy
      isDefault: true
    - name: Loki
      type: loki
      url: http://loki:3100

dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true`,

  argocd: `# ArgoCD Values
server:
  service:
    type: LoadBalancer
  ingress:
    enabled: true
    className: nginx
    hosts:
      - argocd.example.com
  config:
    repositories: |
      - url: https://github.com/your-org/your-repo
        passwordSecret:
          name: repo-secret
          key: password
    oidc.config: |
      name: Example SSO
      issuer: https://auth.example.com

applicationSet:
  enabled: true

notifications:
  enabled: true
  argocdUrl: https://argocd.example.com`,

  loki: `# Loki Values
persistence:
  enabled: true
  size: 10Gi

config:
  auth_enabled: false
  ingester:
    chunk_idle_period: 3m
    chunk_retain_period: 1m
    lifecycler:
      ring:
        kvstore:
          store: inmemory
        replication_factor: 1
  limits_config:
    enforce_metric_name: false
    reject_old_samples: true
    reject_old_samples_max_age: 168h
  schema_config:
    configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h`,

  karpenter: `# Karpenter Values
controller:
  resources:
    requests:
      cpu: 1
      memory: 1Gi
    limits:
      cpu: 2
      memory: 2Gi

settings:
  aws:
    clusterName: "eks-cluster"
    defaultInstanceProfile: "KarpenterNodeInstanceProfile"
    interruptionQueueName: "karpenter-interruption"

provisioners:
  - name: default
    limits:
      resources:
        cpu: 1000
        memory: 1000Gi
    requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot", "on-demand"]
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]`,

  certManager: `# Cert-Manager Values
installCRDs: true
webhook:
  timeoutSeconds: 30

prometheus:
  enabled: true
  servicemonitor:
    enabled: true

clusterIssuers:
  - name: letsencrypt-prod
    email: admin@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
  - name: letsencrypt-staging
    email: admin@example.com
    server: https://acme-staging-v02.api.letsencrypt.org/directory`,

  nginx: `# NGINX Ingress Controller Values
controller:
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
  config:
    use-forwarded-headers: "true"
    compute-full-forwarded-for: "true"
    use-proxy-protocol: "false"
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10`,

  istio: `# Istio Values
pilot:
  autoscaleEnabled: true
  autoscaleMin: 2
  autoscaleMax: 5

gateway:
  enabled: true

telemetry:
  v2:
    prometheus:
      configOverride:
        inboundSidecar:
          disable_host_header_fallback: true
        outboundSidecar:
          disable_host_header_fallback: true`,

  velero: `# Velero Values
configuration:
  provider: aws
  backupStorageLocation:
    bucket: velero-backups
    region: us-east-1
    config:
      s3ForcePathStyle: true
  volumeSnapshotLocation:
    provider: aws
    config:
      region: us-east-1

schedules:
  daily-backup:
    schedule: "0 2 * * *"
    template:
      ttl: "720h0m0s"
      includedNamespaces:
      - "*"`,

  fluxcd: `# FluxCD Values
gitRepository:
  url: https://github.com/your-org/flux-config
  branch: main
  interval: 1m

kustomization:
  interval: 10m
  path: "./clusters/production"
  prune: true
  validation: client`,

  falco: `# Falco Values
falco:
  grpc:
    enabled: true
  grpcOutput:
    enabled: true

customRules:
  rules-custom.yaml: |-
    - rule: Unauthorized Process
      desc: Detect unauthorized process
      condition: spawned_process and not proc.name in (allowed_processes)
      output: Unauthorized process started
      priority: WARNING`,

  trivy: `# Trivy Operator Values
operator:
  scanJobTimeout: 5m

trivy:
  ignoreUnfixed: true
  severity: CRITICAL,HIGH,MEDIUM

webhooks:
  - name: slack
    url: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK`,

  externalDns: `# External DNS Values
sources:
  - service
  - ingress
provider: aws
aws:
  region: us-east-1
  zoneType: public
domainFilters:
  - example.com
policy: sync
txtOwnerId: "external-dns"`,

  awsLoadBalancer: `# AWS Load Balancer Controller Values
clusterName: eks-cluster
serviceAccount:
  create: true
  name: aws-load-balancer-controller
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/AWSLoadBalancerControllerRole

enableShield: true
enableWaf: true
enableWafv2: true

defaultTags:
  Environment: Production
  ManagedBy: OpenPrime`,
};
