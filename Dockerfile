# Build stage
FROM node:24.5.0-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install envsubst for runtime environment variable injection
RUN apk add --no-cache gettext

# Copy custom nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Set permissions for existing nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port 8080 for non-root
EXPOSE 8080

# nginx config: non-root port 8080, SPA routing, env.js, and JSON access logs
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create environment injection script for read-only filesystem
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-inject-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'echo "🔧 Injecting runtime environment variables..."' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo '# Process env.js template with runtime variables' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'envsubst < /usr/share/nginx/html/env.js > /tmp/env.js' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo '# Copy processed env.js to writable location accessible by nginx' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'cp /tmp/env.js /var/cache/nginx/env.js' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'echo "✅ Environment variables injected successfully"' >> /docker-entrypoint.d/10-inject-env.sh && \
    chmod +x /docker-entrypoint.d/10-inject-env.sh

# Switch to non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
