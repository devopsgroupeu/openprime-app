# Container Environment Configuration

This document explains how to configure environment variables for containerized deployments of the OpenPrime React application.

## Overview

The application supports **runtime environment injection**, allowing the same Docker image to be deployed across different environments (dev/staging/prod) with different configurations.

### How It Works

1. **Build Time** (Development): Environment variables from `.env` file are baked into the bundle
2. **Runtime** (Containers): Environment variables are injected via `window._env_` object from `/env.js`
3. **Priority**: Runtime variables override build-time variables

## Required Environment Variables

All of these variables must be set in either development (`.env` file) or container deployment:

```bash
# Keycloak Authentication
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=openprime
REACT_APP_KEYCLOAK_CLIENT_ID=openprime-app

# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

## Development Setup

For local development, create a `.env` file:

```bash
# .env
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=openprime
REACT_APP_KEYCLOAK_CLIENT_ID=openprime-app
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BACKEND_URL=http://localhost:3001/api
```

## Container Deployment

### Method 1: Using envsubst (Recommended)

1. **Build the Docker image** (variables are not needed at build time):
   ```bash
   docker build -t openprime-app .
   ```

2. **Run with runtime environment injection**:
   ```bash
   # Using envsubst to process env.js template
   docker run -d \
     -e REACT_APP_KEYCLOAK_URL=https://keycloak.yourdomain.com \
     -e REACT_APP_KEYCLOAK_REALM=production \
     -e REACT_APP_KEYCLOAK_CLIENT_ID=openprime-prod \
     -e REACT_APP_API_URL=https://api.yourdomain.com/api \
     -e REACT_APP_BACKEND_URL=https://api.yourdomain.com/api \
     --name openprime-app \
     -p 8080:80 \
     openprime-app
   ```

3. **Process env.js template on container start**:
   ```bash
   # Add to your Dockerfile or init script:
   envsubst < /usr/share/nginx/html/env.js > /tmp/env.js && mv /tmp/env.js /usr/share/nginx/html/env.js
   ```

### Method 2: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  openprime-app:
    build: .
    ports:
      - "8080:80"
    environment:
      - REACT_APP_KEYCLOAK_URL=https://keycloak.yourdomain.com
      - REACT_APP_KEYCLOAK_REALM=production
      - REACT_APP_KEYCLOAK_CLIENT_ID=openprime-prod
      - REACT_APP_API_URL=https://api.yourdomain.com/api
      - REACT_APP_BACKEND_URL=https://api.yourdomain.com/api
    command: |
      sh -c "
        envsubst < /usr/share/nginx/html/env.js > /tmp/env.js &&
        mv /tmp/env.js /usr/share/nginx/html/env.js &&
        nginx -g 'daemon off;'
      "
```

### Method 3: Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openprime-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: openprime-app
  template:
    metadata:
      labels:
        app: openprime-app
    spec:
      initContainers:
      - name: env-injector
        image: openprime-app
        command:
        - sh
        - -c
        - |
          envsubst < /usr/share/nginx/html/env.js > /tmp/env.js &&
          cp /tmp/env.js /shared/env.js
        env:
        - name: REACT_APP_KEYCLOAK_URL
          value: "https://keycloak.yourdomain.com"
        - name: REACT_APP_KEYCLOAK_REALM
          value: "production"
        - name: REACT_APP_KEYCLOAK_CLIENT_ID
          value: "openprime-prod"
        - name: REACT_APP_API_URL
          value: "https://api.yourdomain.com/api"
        - name: REACT_APP_BACKEND_URL
          value: "https://api.yourdomain.com/api"
        volumeMounts:
        - name: shared-env
          mountPath: /shared
      containers:
      - name: openprime-app
        image: openprime-app
        ports:
        - containerPort: 80
        volumeMounts:
        - name: shared-env
          mountPath: /usr/share/nginx/html/env.js
          subPath: env.js
      volumes:
      - name: shared-env
        emptyDir: {}
```

## Enhanced Dockerfile Example

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Install envsubst for runtime env injection
RUN apk add --no-cache gettext

# Create env injection script
COPY <<EOF /docker-entrypoint.d/10-inject-env.sh
#!/bin/sh
set -e

echo "Injecting runtime environment variables..."

# Process env.js template with actual environment variables
envsubst < /usr/share/nginx/html/env.js > /tmp/env.js
mv /tmp/env.js /usr/share/nginx/html/env.js

echo "Environment variables injected successfully"
EOF

RUN chmod +x /docker-entrypoint.d/10-inject-env.sh

EXPOSE 80
```

## Debugging Environment Variables

### Check Current Configuration

The application logs environment variable sources on startup:

```javascript
// Development console output:
✅ Environment configuration loaded successfully
🔧 Build-time variables (development): ["KEYCLOAK_URL=http://localhost:8080", ...]
📦 Runtime variables (container): ["BACKEND_URL=https://api.prod.com/api", ...]
```

### Verify Runtime Injection

1. **Check if env.js is loaded**:
   ```javascript
   // Browser console
   console.log(window._env_);
   ```

2. **Check for unprocessed templates**:
   ```javascript
   // If you see "$REACT_APP_BACKEND_URL", envsubst didn't run
   console.log(window._env_.BACKEND_URL);
   ```

### Common Issues

1. **"Missing required environment variables" error**:
   - Check that all required variables are set
   - Verify envsubst processed the env.js file
   - Check browser network tab for env.js load errors

2. **Variables not updating between environments**:
   - Clear browser cache
   - Verify different environments use different env.js content
   - Check that envsubst ran during container startup

3. **Application fails to start**:
   - Check browser console for specific missing variables
   - Verify env.js is accessible at `/env.js`
   - Ensure script tag loads before React initialization

## Migration from Build-Time Variables

If you currently use build-time variables only:

1. **Current approach** (build-time only):
   ```javascript
   const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001/api';
   ```

2. **New approach** (runtime + build-time):
   ```javascript
   import { getBackendUrl } from '../utils/envValidator';
   const backendUrl = getBackendUrl();
   ```

The new system provides backward compatibility while adding runtime configuration support.

## Security Considerations

- ✅ **No hardcoded defaults** - prevents accidental use of development URLs in production
- ✅ **Fail-fast validation** - application won't start with missing configuration
- ✅ **Environment isolation** - different environments use different configurations
- ✅ **Container-friendly** - single image works across all environments
- ⚠️ **Client-side exposure** - remember that all variables are visible in browser
