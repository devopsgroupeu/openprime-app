#!/bin/sh
# Runs from /docker-entrypoint.d/ before nginx starts (nginx:alpine entrypoint).
#
# Two things have to be produced at container start rather than at build time,
# for the same reason: they depend on the deployment's Keycloak and API origins,
# which arrive as environment variables, while the image is built once and
# shipped everywhere.
set -e

# /var/cache/nginx is the only writable directory the container has:
# securityContext sets readOnlyRootFilesystem: true and the chart mounts an
# emptyDir here. Note the emptyDir SHADOWS anything baked into this path at
# build time, so both files below must be written on every start.
RUNTIME_DIR=/var/cache/nginx

echo "🔧 Injecting runtime environment variables..."
envsubst < /usr/share/nginx/html/env.js > /tmp/env.js
cp /tmp/env.js "${RUNTIME_DIR}/env.js"

# --- Content-Security-Policy -------------------------------------------------
#
# connect-src has to name the real Keycloak and API origins; a policy hardcoded
# into nginx.conf would be wrong for every deployment whose origins differ, and
# a wrong connect-src breaks login rather than degrading gracefully.
#
# Strip any path: REACT_APP_API_URL is ".../api", and CSP source expressions
# match on origin. An unset or relative value yields an empty string, which
# leaves the directive as just 'self'.
origin_of() {
  echo "$1" | sed -n 's|^\([a-zA-Z][a-zA-Z0-9+.-]*://[^/]*\).*|\1|p'
}

API_ORIGIN=$(origin_of "${REACT_APP_API_URL:-}")
KEYCLOAK_ORIGIN=$(origin_of "${REACT_APP_KEYCLOAK_URL:-}")

# script-src stays 'self': the built index.html carries no inline script - only
# /env.js and the hashed Vite bundle - so no 'unsafe-inline' is needed and the
# XSS sink this policy exists to close stays closed.
#
# style-src needs 'unsafe-inline' because React writes element style attributes.
#
# frame-src names Keycloak even though keycloak-js is initialised with
# checkLoginIframe: false today. It costs one origin, and the alternative is
# that switching to check-sso silently breaks login in production.
CSP="default-src 'self'; \
script-src 'self'; \
style-src 'self' 'unsafe-inline'; \
img-src 'self' data: blob:; \
font-src 'self' data:; \
connect-src 'self' ${API_ORIGIN} ${KEYCLOAK_ORIGIN}; \
frame-src 'self' ${KEYCLOAK_ORIGIN}; \
frame-ancestors 'none'; \
base-uri 'self'; \
form-action 'self'; \
object-src 'none'"

# Collapse the whitespace left by unset origins so the header is clean.
CSP=$(echo "${CSP}" | tr -s ' ' | sed 's/ ;/;/g')

# nginx's add_header does not inherit into a location that declares any
# add_header of its own, so nginx.conf includes this file in every such block.
printf 'add_header Content-Security-Policy "%s" always;\n' "${CSP}" \
  > "${RUNTIME_DIR}/csp.conf"

echo "✅ Environment variables injected successfully"
echo "🔒 CSP connect-src: 'self' ${API_ORIGIN} ${KEYCLOAK_ORIGIN}"
