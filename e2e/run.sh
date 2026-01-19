#!/usr/bin/env bash

# Set credentials
export KEYCLOAK_USERNAME=testuser
export KEYCLOAK_PASSWORD=password123
export HEADLESS=false
export VERBOSE=true

# Run tests
npm run test:e2e
