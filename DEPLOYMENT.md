# OpenPrime App Deployment Guide

This document provides comprehensive guidance for deploying the OpenPrime React frontend application using Helm charts and the automated CI/CD pipeline.

## Overview

The OpenPrime application now includes:
- **Helm Chart** - Production-ready Kubernetes deployment configuration
- **CI/CD Pipeline** - Automated building, testing, and publishing workflow
- **Container Image** - Multi-stage Docker build optimized for production
- **Registry Integration** - Automatic publishing to GitHub Container Registry

## Quick Start

### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.2.0+
- kubectl configured for your cluster

### Basic Deployment

```bash
# Install from GitHub Container Registry (recommended)
helm install openprime-app oci://ghcr.io/devopsgroupeu/helm/openprime-app

# Or install from local chart
helm install openprime-app ./chart
```

## Helm Chart Structure

```
chart/openprime-app/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── templates/
│   ├── _helpers.tpl        # Template helpers
│   ├── deployment.yaml     # Kubernetes Deployment
│   ├── service.yaml        # Kubernetes Service
│   ├── ingress.yaml        # Ingress configuration
│   ├── serviceaccount.yaml # Service Account
│   ├── hpa.yaml           # Horizontal Pod Autoscaler
│   └── networkpolicy.yaml  # Network Policy
├── .helmignore            # Files to ignore during packaging
└── README.md              # Chart documentation
```

## CI/CD Pipeline

The pipeline (`.github/workflows/helm-chart.yml`) automatically:

### On Pull Request
- Lints Helm chart
- Tests chart templating
- Validates configuration

### On Push to main/dev
- Builds and publishes Docker image
- Updates chart with new image version
- Publishes Helm chart to OCI registry
- Runs security scanning with Trivy

### On Release
- Tags images and charts with release version
- Creates release notes with installation instructions

## Configuration Options

### Environment Variables

Configure the React app through `values.yaml`:

```yaml
app:
  env:
    REACT_APP_API_URL: "https://api.your-domain.com"
    REACT_APP_KEYCLOAK_URL: "https://keycloak.your-domain.com"
    REACT_APP_KEYCLOAK_REALM: "your-realm"
    REACT_APP_KEYCLOAK_CLIENT_ID: "your-client-id"
```

### Resource Management

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
```

### Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: openprime.your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: openprime-tls
      hosts:
        - openprime.your-domain.com
```

## Deployment Scenarios

### Development Environment

Create `values-dev.yaml`:

```yaml
replicaCount: 1

image:
  tag: "dev"

app:
  env:
    NODE_ENV: "development"
    REACT_APP_API_URL: "http://openprime-backend-dev:3001"

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi

ingress:
  enabled: true
  hosts:
    - host: openprime-dev.local
      paths:
        - path: /
          pathType: Prefix
```

Deploy:
```bash
helm install openprime-app-dev ./chart/openprime-app -f values-dev.yaml
```

### Staging Environment

Create `values-staging.yaml`:

```yaml
replicaCount: 2

image:
  tag: "staging"

app:
  env:
    REACT_APP_API_URL: "https://api-staging.your-domain.com"
    REACT_APP_KEYCLOAK_URL: "https://keycloak-staging.your-domain.com"

resources:
  limits:
    cpu: 300m
    memory: 256Mi
  requests:
    cpu: 150m
    memory: 128Mi

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging
  hosts:
    - host: openprime-staging.your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: openprime-staging-tls
      hosts:
        - openprime-staging.your-domain.com
```

Deploy:
```bash
helm install openprime-app-staging ./chart/openprime-app -f values-staging.yaml
```

### Production Environment

Create `values-prod.yaml`:

```yaml
replicaCount: 3

image:
  tag: "v0.2.0"  # Use specific version for production

app:
  env:
    REACT_APP_API_URL: "https://api.your-domain.com"
    REACT_APP_KEYCLOAK_URL: "https://keycloak.your-domain.com"
    REACT_APP_KEYCLOAK_REALM: "production"
    NODE_ENV: "production"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
  hosts:
    - host: openprime.your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: openprime-prod-tls
      hosts:
        - openprime.your-domain.com

# Enable network policies for security
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: openprime-backend
      ports:
        - protocol: TCP
          port: 3001
```

Deploy:
```bash
helm install openprime-app ./chart/openprime-app -f values-prod.yaml
```

## Local Development and Testing

### Test Chart Locally

```bash
# Run the packaging script
./scripts/helm-package.sh

# Test with different configurations
helm template test ./chart/openprime-app --set ingress.enabled=true
helm template test ./chart/openprime-app --set autoscaling.enabled=true
```

### Build Docker Image Locally

```bash
# Build image
docker build -t openprime-app:local .

# Test image
docker run -p 8080:8080 openprime-app:local
```

## Monitoring and Troubleshooting

### Health Checks

The chart includes built-in health checks:
- **Liveness Probe**: HTTP GET on `/` (port 8080)
- **Readiness Probe**: HTTP GET on `/` (port 8080)

### Common Commands

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=openprime-app

# View logs
kubectl logs -l app.kubernetes.io/name=openprime-app -f

# Check service endpoints
kubectl get endpoints openprime-app

# Describe deployment
kubectl describe deployment openprime-app

# Port forward for testing
kubectl port-forward service/openprime-app 8080:80
```

### Upgrade Deployments

```bash
# Upgrade with new values
helm upgrade openprime-app ./chart/openprime-app -f values-prod.yaml

# Rollback if needed
helm rollback openprime-app 1

# Check rollout status
kubectl rollout status deployment/openprime-app
```

## Security Considerations

The chart implements several security best practices:

- **Non-root User**: Container runs as user 101 (nginx)
- **Read-only Root Filesystem**: Prevents file system modifications
- **Dropped Capabilities**: Removes unnecessary Linux capabilities
- **Security Context**: Enforces security policies
- **Network Policies**: Controls network traffic (optional)
- **Resource Limits**: Prevents resource exhaustion

## Integration with Backend Services

The chart is designed to work with the broader OpenPrime ecosystem:

- **openprime-backend**: Configure via `REACT_APP_API_URL`
- **Keycloak**: Authentication service integration
- **PostgreSQL**: Database for backend (indirect dependency)

## Next Steps

1. **Customize Values**: Create environment-specific values files
2. **Set up DNS**: Point your domain to the ingress controller
3. **Configure TLS**: Set up cert-manager for HTTPS certificates
4. **Monitoring**: Integrate with Prometheus/Grafana
5. **Logging**: Set up centralized logging with ELK/Loki stack
6. **Backup**: Configure backup strategies for persistent data

## Support

For issues and questions:
- Check the chart README: `chart/openprime-app/README.md`
- Review the troubleshooting section above
- Create an issue in the repository
- Contact the DevOps Group team
