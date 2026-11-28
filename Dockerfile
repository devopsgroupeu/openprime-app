# Build stage
FROM node:26.13.0-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm ci verifies every package against the integrity
# hashes in package-lock.json)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:1.31.8-alpine@sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11 AS production

# Alpine security fixes the pinned base digest does not carry yet. Remove this
# step once Dependabot bumps the nginx digest to a rebuild that includes them.
#   libxml2: CVE-2026-86144, fixed in 2.13.9-r3
#   libxslt: CVE-2026-9947, CVE-2026-87636, CVE-2026-125350, fixed in 1.1.43-r4
RUN apk upgrade --no-cache libxml2 libxslt

# Non-root user with a fixed UID/GID 1000, matching runAsUser/fsGroup in the
# chart (H97). The image's own "nginx" user (uid 101) is left in place but unused.
# envsubst, used by 10-inject-env.sh, already ships in the base image
# (gettext-envsubst), so gettext is no longer installed.
RUN addgroup -S -g 1000 app \
 && adduser -S -D -H -u 1000 -G app -s /sbin/nologin app \
 && chown 1000:1000 /var/cache/nginx \
 && touch /run/nginx.pid \
 && chown 1000:1000 /run/nginx.pid

# The built app, nginx config and entrypoint script stay root-owned, so the
# nginx process (uid 1000) can read but not rewrite them.
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config: non-root port 8080, SPA routing, env.js, and JSON access logs
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime injection for the read-only filesystem: env.js and the CSP, both of
# which depend on the deployment's Keycloak/API origins. Kept as a real file
# rather than a chain of echoes so it can be reviewed and edited.
COPY --chmod=755 docker/10-inject-env.sh /docker-entrypoint.d/10-inject-env.sh

# Port 8080: an unprivileged port, so no NET_BIND_SERVICE capability is needed
EXPOSE 8080

# Writable at runtime, and nothing else: /tmp, /var/cache/nginx and /run
# (= /var/run). With a read-only root filesystem mount them as tmpfs/emptyDir;
# the chart already does.
# Numeric, so the kubelet can verify runAsNonRoot.
USER 1000:1000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
