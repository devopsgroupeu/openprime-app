#!/bin/bash

# Helm Chart Packaging and Testing Script
# Usage: ./scripts/helm-package.sh [version]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CHART_DIR="$PROJECT_DIR/chart/openprime-app"
OUTPUT_DIR="$PROJECT_DIR/charts"
VERSION=${1:-"0.2.0"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}OpenPrime App Helm Chart Packaging and Testing${NC}"
echo "========================================"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Update chart version if provided
if [ "$#" -eq 1 ]; then
    echo -e "${YELLOW}Updating chart version to: $VERSION${NC}"
    sed -i.bak "s/^version:.*/version: $VERSION/" "$CHART_DIR/Chart.yaml"
    sed -i.bak "s/^appVersion:.*/appVersion: \"$VERSION\"/" "$CHART_DIR/Chart.yaml"
    rm -f "$CHART_DIR/Chart.yaml.bak"
fi

# Lint the chart
echo -e "${YELLOW}Linting Helm chart...${NC}"
if helm lint "$CHART_DIR"; then
    echo -e "${GREEN}✓ Chart linting passed${NC}"
else
    echo -e "${RED}✗ Chart linting failed${NC}"
    exit 1
fi

# Template the chart (dry run)
echo -e "${YELLOW}Testing chart templating...${NC}"
if helm template test "$CHART_DIR" > /dev/null; then
    echo -e "${GREEN}✓ Chart templating passed${NC}"
else
    echo -e "${RED}✗ Chart templating failed${NC}"
    exit 1
fi

# Test with different configurations
echo -e "${YELLOW}Testing with ingress enabled...${NC}"
if helm template test "$CHART_DIR" --set ingress.enabled=true > /dev/null; then
    echo -e "${GREEN}✓ Ingress configuration test passed${NC}"
else
    echo -e "${RED}✗ Ingress configuration test failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Testing with autoscaling enabled...${NC}"
if helm template test "$CHART_DIR" --set autoscaling.enabled=true > /dev/null; then
    echo -e "${GREEN}✓ Autoscaling configuration test passed${NC}"
else
    echo -e "${RED}✗ Autoscaling configuration test failed${NC}"
    exit 1
fi

# Package the chart
echo -e "${YELLOW}Packaging Helm chart...${NC}"
CHART_VERSION=$(grep '^version:' "$CHART_DIR/Chart.yaml" | awk '{print $2}')
if helm package "$CHART_DIR" --destination "$OUTPUT_DIR"; then
    echo -e "${GREEN}✓ Chart packaged successfully: openprime-app-${CHART_VERSION}.tgz${NC}"
else
    echo -e "${RED}✗ Chart packaging failed${NC}"
    exit 1
fi

# Verify the package
PACKAGE_FILE="$OUTPUT_DIR/openprime-app-${CHART_VERSION}.tgz"
if [ -f "$PACKAGE_FILE" ]; then
    echo -e "${GREEN}✓ Package file created: $(basename "$PACKAGE_FILE")${NC}"
    echo -e "${BLUE}Package size: $(du -h "$PACKAGE_FILE" | cut -f1)${NC}"
else
    echo -e "${RED}✗ Package file not found${NC}"
    exit 1
fi

# Show package contents
echo -e "${YELLOW}Package contents:${NC}"
tar -tzf "$PACKAGE_FILE" | head -20

echo -e "\n${GREEN}All tests passed! Chart is ready for deployment.${NC}"
echo -e "\n${BLUE}Usage examples:${NC}"
echo -e "  helm install openprime-app $PACKAGE_FILE"
echo -e "  helm install openprime-app oci://ghcr.io/devopsgroupeu/helm/openprime-app --version $CHART_VERSION"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  1. Push to git to trigger the CI/CD pipeline"
echo -e "  2. The pipeline will build the Docker image and publish the chart"
echo -e "  3. Install the chart in your Kubernetes cluster"
