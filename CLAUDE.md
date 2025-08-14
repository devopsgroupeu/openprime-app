# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenPrime is a React-based infrastructure management platform that allows users to configure and deploy infrastructure environments on AWS or on-premise. The application features a visual interface for managing complex infrastructure configurations including AWS services, Kubernetes Helm charts, and various deployment options.

## Development Commands

### Essential Commands
- `npm start` - Run development server (http://localhost:3000)
- `npm test` - Run test suite in watch mode
- `npm run build` - Build production bundle
- `npm install` - Install dependencies

### Docker Development
- `docker build .` - Build Docker image (uses Node 24.5.0-alpine)
- `docker-compose up` - Run application in container with live reload

## Architecture Overview

### Core Application Structure
- **App.js**: Main router component managing page navigation state and environment data
- **Navigation.js**: Top-level navigation bar with routing between Home, Environments, and Settings
- **Configuration System**: Centralized in `src/config/environmentsConfig.js` containing:
  - Pre-built environment templates
  - AWS service configurations with detailed parameters
  - Helm chart default values for 15+ charts (Prometheus, Grafana, ArgoCD, etc.)
  - Infrastructure-as-Code export capabilities

### Page Components
- **HomePage**: Landing page with feature overview and call-to-action
- **EnvironmentsPage**: Environment management with creation/editing capabilities
- **SettingsPage**: Application settings management

### Environment Management
- **EnvironmentCard**: Visual representation of infrastructure environments with service status
- **NewEnvironmentModal**: Complex form for creating new environments with service configurations
- **HelmValuesModal**: YAML editor for customizing Helm chart values

## Key Features

### Infrastructure Configuration
The application supports extensive AWS service configuration:
- **Core Services**: VPC, EKS, RDS, OpenSearch, ECR, S3
- **Additional Services**: Lambda, ElastiCache, SQS, SNS, CloudFront, Route53, Secrets Manager, IAM
- **Kubernetes Integration**: EKS with auto-scaling, node groups, and comprehensive addon support

### Helm Chart Management
Built-in support for production-ready Helm charts with customizable values:
- **Monitoring Stack**: Prometheus, Grafana, Loki
- **CI/CD**: ArgoCD, FluxCD
- **Infrastructure**: Cert-Manager, External-DNS, NGINX Ingress, Istio
- **Operations**: Karpenter, Velero, Falco, Trivy Operator

### UI/UX Patterns
- **Styling**: Tailwind CSS with dark theme and glassmorphism effects
- **Icons**: Lucide React for consistent iconography
- **State Management**: React hooks with local component state
- **Responsive Design**: Mobile-friendly layouts with grid systems

## Important Implementation Details

### Environment Configuration Structure
Environments contain deeply nested service configurations with enabled/disabled flags and detailed parameters. When modifying environment configs, maintain the existing structure in `environmentsConfig.js:158-298`.

### Modal System
Modals use backdrop blur effects and handle complex state management. The NewEnvironmentModal manages expandable service sections and Helm chart customization flows.

### Testing Framework
Uses React Testing Library with Jest. Tests are configured for React 19 compatibility with modern testing patterns.

## Technology Stack
- **Frontend**: React 19.1.1 with modern hooks
- **Styling**: Tailwind CSS 3.3.3 with PostCSS
- **Icons**: Lucide React 0.539.0
- **Testing**: React Testing Library, Jest
- **Build Tool**: React Scripts 5.0.1
- **Container**: Docker with Node.js 24.5.0-alpine
