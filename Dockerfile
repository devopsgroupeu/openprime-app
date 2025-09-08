# Build stage
FROM node:24.5.0-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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
COPY --from=build /app/build /usr/share/nginx/html

# Set permissions for existing nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose port 8080 for non-root
EXPOSE 8080

# Create nginx config for non-root port
RUN echo "server { \
    listen 8080; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Create environment injection script
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-inject-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'echo "🔧 Injecting runtime environment variables..."' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'envsubst < /usr/share/nginx/html/env.js > /tmp/env.js' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'mv /tmp/env.js /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/10-inject-env.sh && \
    echo 'echo "✅ Environment variables injected successfully"' >> /docker-entrypoint.d/10-inject-env.sh && \
    chmod +x /docker-entrypoint.d/10-inject-env.sh

# Switch to non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
