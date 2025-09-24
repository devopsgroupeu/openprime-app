# OpenPrime App Helm Chart

This Helm chart deploys the OpenPrime React frontend application to a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- Container registry access (for pulling images)

## Installing the Chart

To install the chart with the release name `openprime-app`:

```bash
# From OCI registry (recommended)
helm install openprime-app oci://ghcr.io/devopsgroupeu/helm/openprime-app --version 0.2.0

# From local chart
helm install openprime-app ./chart
```

## Uninstalling the Chart

To uninstall/delete the `openprime-app` deployment:

```bash
helm uninstall openprime-app
```

## Configuration

The following table lists the configurable parameters of the OpenPrime App chart and their default values.

### Application Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `openprime/openprime-app` |
| `image.tag` | Image tag | `""` (uses chart appVersion) |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Container port | `8080` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts | `[{"host": "openprime.local", "paths": [{"path": "/", "pathType": "Prefix"}]}]` |
| `ingress.tls` | Ingress TLS configuration | `[]` |

### Resource Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `200m` |
| `resources.limits.memory` | Memory limit | `256Mi` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `128Mi` |

### Autoscaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Minimum replicas | `2` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization | `80` |

### Application Environment Variables

| Parameter | Description | Default |
|-----------|-------------|---------|
| `app.env.REACT_APP_API_URL` | Backend API URL | `http://openprime-backend:3001` |
| `app.env.REACT_APP_KEYCLOAK_URL` | Keycloak URL | `http://keycloak:8080` |
| `app.env.REACT_APP_KEYCLOAK_REALM` | Keycloak realm | `openprime` |
| `app.env.REACT_APP_KEYCLOAK_CLIENT_ID` | Keycloak client ID | `openprime-frontend` |

## Example Configurations

### Basic Deployment

```yaml
# values-basic.yaml
replicaCount: 2
service:
  type: ClusterIP
  port: 80
```

### Production Deployment with Ingress

```yaml
# values-production.yaml
replicaCount: 3
image:
  tag: "v0.2.0"

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    kubernetes.io/ingress.class: nginx
  hosts:
    - host: openprime.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: openprime-tls
      hosts:
        - openprime.example.com

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
```

### Development Environment

```yaml
# values-dev.yaml
replicaCount: 1

app:
  env:
    REACT_APP_API_URL: "http://openprime-backend-dev:3001"
    REACT_APP_KEYCLOAK_URL: "http://keycloak-dev:8080"
    NODE_ENV: "development"

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi
```

## Deployment Commands

```bash
# Development
helm install openprime-app ./chart -f values-dev.yaml

# Production
helm install openprime-app ./chart -f values-production.yaml

# Upgrade
helm upgrade openprime-app ./chart -f values-production.yaml

# Check status
helm status openprime-app

# Get values
helm get values openprime-app
```

## Security Considerations

The chart includes several security best practices:

- Non-root container execution (user ID 101)
- Read-only root filesystem
- Dropped capabilities
- Security contexts configured
- Network policies support
- Resource limits enforced

## Monitoring and Health Checks

The chart includes:
- Liveness probes on HTTP `/` endpoint
- Readiness probes on HTTP `/` endpoint
- Configurable probe parameters
- Resource monitoring for autoscaling

## Dependencies

This chart works best when deployed alongside:
- `openprime-backend` - Backend API service
- `keycloak` - Authentication service
- `postgresql` - Database for backend
- Ingress controller (nginx, traefik, etc.)
- Cert-manager (for TLS certificates)

## Troubleshooting

### Pod Issues
```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=openprime-app

# Check logs
kubectl logs -l app.kubernetes.io/name=openprime-app -f

# Describe pod for events
kubectl describe pod <pod-name>
```

### Service Issues
```bash
# Test service connectivity
kubectl port-forward service/openprime-app 8080:80

# Check service endpoints
kubectl get endpoints openprime-app
```

### Ingress Issues
```bash
# Check ingress
kubectl get ingress openprime-app -o yaml

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```
