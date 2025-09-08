# Environment Variable Consolidation

## Summary

The OpenPrime React application previously used two separate environment variables (`REACT_APP_API_URL` and `REACT_APP_BACKEND_URL`) that pointed to the same backend API endpoint. This redundancy has been eliminated by consolidating to a single variable: **`REACT_APP_API_URL`**.

## Changes Made

### ✅ **Consolidated Environment Variables**

**Before (redundant):**
```bash
REACT_APP_API_URL=http://localhost:3001/api       # Used by authService
REACT_APP_BACKEND_URL=http://localhost:3001/api   # Used by AI chat components
```

**After (consolidated):**
```bash
REACT_APP_API_URL=http://localhost:3001/api       # Used by all components
```

### ✅ **Updated Code Components**

1. **React Components:**
   - `src/components/AuraChatWindow.js` - Now uses `getApiUrl()` instead of `getBackendUrl()`
   - `src/components/modals/AIChatModal.js` - Now uses `getApiUrl()` instead of `getBackendUrl()`
   - `src/services/authService.js` - Continues using `getApiUrl()` (no change)

2. **Environment Utilities:**
   - `src/utils/envValidator.js` - Removed duplicate BACKEND_URL configuration
   - `getBackendUrl()` function now deprecated with warning, redirects to `getApiUrl()`
   - Legacy compatibility maintained for `REACT_APP_BACKEND_URL` references

3. **Configuration Files:**
   - `.env` - Removed duplicate `REACT_APP_BACKEND_URL` entry
   - `public/env.js` - Removed `BACKEND_URL` template variable
   - Runtime environment injection now only processes `REACT_APP_API_URL`

### ✅ **Updated Deployment Configurations**

1. **Docker & Docker Compose:**
   - `openprime-local-testing/docker-compose.yml` - Removed duplicate variable
   - Container environment injection simplified

2. **Helm Charts:**
   - `openprime-app/chart/values.yaml` - Consolidated to single API URL
   - `openprime-local-testing/dev/values/frontend.yaml` - Removed duplicate
   - Kubernetes deployments use consistent environment variable

## Required Environment Variable

All deployments now require **only one** backend API environment variable:

```yaml
# Required Environment Variable
REACT_APP_API_URL: "https://your-api-server.com/api"

# Optional (for legacy compatibility)
REACT_APP_BACKEND_URL: "https://your-api-server.com/api"  # Redirects to API_URL
```

## Deployment Examples

### Development (.env file)
```bash
# Backend API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Keycloak Configuration
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=openprime
REACT_APP_KEYCLOAK_CLIENT_ID=openprime-app
```

### Docker Container
```bash
docker run -d \
  -e REACT_APP_API_URL=https://api.production.com/api \
  -e REACT_APP_KEYCLOAK_URL=https://auth.production.com \
  -p 8080:8080 \
  openprime-app:latest
```

### Kubernetes (Helm)
```yaml
app:
  env:
    REACT_APP_API_URL: "https://api.production.com/api"
    REACT_APP_KEYCLOAK_URL: "https://auth.production.com"
    REACT_APP_KEYCLOAK_REALM: "production"
    REACT_APP_KEYCLOAK_CLIENT_ID: "openprime-prod"
```

## Backward Compatibility

### ✅ **Legacy Support Maintained**
- Code still accepts `REACT_APP_BACKEND_URL` but shows deprecation warning
- Existing deployments continue working without immediate changes
- `getBackendUrl()` function redirects to `getApiUrl()` with warning

### ⚠️ **Migration Recommendations**
1. **Update deployment configurations** to use `REACT_APP_API_URL` only
2. **Remove `REACT_APP_BACKEND_URL`** references from your deployment scripts
3. **Update documentation** and runbooks to reflect consolidated variable

## Runtime Environment Injection

The runtime environment injection system has been simplified:

### Container Template (`public/env.js`)
```javascript
// Before (redundant)
window._env_ = {
  API_URL: "$REACT_APP_API_URL",
  BACKEND_URL: "$REACT_APP_BACKEND_URL"  // Duplicate!
};

// After (consolidated)
window._env_ = {
  API_URL: "$REACT_APP_API_URL"
};
```

### Container Startup Processing
```bash
# envsubst processes single template variable
envsubst < /usr/share/nginx/html/env.js > /tmp/env.js
# Result: API_URL gets actual value, no duplicate processing
```

## Benefits

### ✅ **Simplified Configuration**
- **Single source of truth** for backend API URL
- **Reduced configuration complexity** in deployments
- **Clearer semantic meaning** - one API, one variable

### ✅ **Reduced Errors**
- **No configuration drift** between duplicate variables
- **Consistent values** across all application components
- **Simplified troubleshooting** - only one variable to check

### ✅ **Improved Maintenance**
- **Fewer environment variables** to manage in deployments
- **Simpler template processing** in containers
- **Reduced documentation complexity**

## Verification

After consolidation, verify correct operation:

### 1. Check Environment Variable
```bash
# Development
cat .env | grep REACT_APP_API_URL

# Container
docker exec <container> printenv REACT_APP_API_URL

# Kubernetes
kubectl exec deployment/openprime-app -- printenv REACT_APP_API_URL
```

### 2. Check Runtime Injection
```javascript
// Browser console
console.log(window._env_);
// Should show: {API_URL: "https://api.production.com/api", ...}
// Should NOT show: {BACKEND_URL: "...", API_URL: "..."}
```

### 3. Check Application Functionality
- ✅ Authentication (authService uses API_URL)
- ✅ AI Chat functionality (now uses API_URL)
- ✅ All API calls work with single endpoint configuration

This consolidation eliminates redundancy while maintaining full functionality and backward compatibility.
