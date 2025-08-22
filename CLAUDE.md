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
- `docker build .` - Build Docker image (multi-stage: Node 24.5.0-alpine + Nginx)
- `docker-compose up` - Run application in container with live reload
- Production build serves from Nginx on port 8080 with non-root user

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
- **EnvironmentDetailPage**: Detailed view of individual environments with service status
- **SettingsPage**: Application settings management

### Environment Management
- **EnvironmentCard**: Visual representation of infrastructure environments with service status
- **EnvironmentWizard**: Multi-step wizard for creating/editing environments with three steps:
  - Basic configuration (name, provider, region)
  - Services configuration (AWS services with dynamic forms)
  - Helm charts selection and customization
- **HelmValuesModal**: YAML editor for customizing Helm chart values

### AI Integration
- **AuraChatButton**: Floating chat button for AI assistance
- **AuraChatWindow**: Chat interface for environment configuration help
- **AIChatModal**: Context-aware AI chat for service-specific guidance

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
- **Styling**: Tailwind CSS with dark/light theme switching and glassmorphism effects
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API (ThemeContext, ToastContext) with hooks
- **Responsive Design**: Mobile-friendly layouts with grid systems
- **Navigation**: Single-page app with programmatic routing (no React Router)
- **Modals**: Backdrop blur effects with accessibility features

## Important Implementation Details

### Configuration Architecture
- **environmentsConfig.js**: Contains initial environments and service configurations
- **servicesConfig.js**: Defines AWS service schemas and validation
- **helmChartsConfig.js**: Helm chart definitions with versions and namespaces
- **providersConfig.js**: Cloud provider configurations (AWS, Azure, GCP, On-premise)

### Environment Configuration Structure
Environments contain deeply nested service configurations with enabled/disabled flags and detailed parameters. The structure includes:
- Basic info (name, type, region, status)
- AWS services (VPC, EKS, RDS, etc.) with comprehensive parameter sets
- Helm chart configurations with custom values support

### Component Architecture
- **Dynamic Service Rendering**: Uses `DynamicServiceConfig` and `DynamicFieldRenderer` for flexible form generation
- **Wizard Pattern**: Multi-step environment creation with validation and progress tracking
- **Context System**: ThemeContext for dark/light mode, ToastContext for notifications

### Testing Framework
Uses React Testing Library with Jest. Tests are configured for React 19 compatibility with modern testing patterns.

## Technology Stack
- **Frontend**: React 19.1.1 with modern hooks and Context API
- **Styling**: Tailwind CSS 3.3.3 with PostCSS and custom smooth scrolling
- **Icons**: Lucide React 0.539.0
- **Testing**: React Testing Library 16.3.0, Jest with React 19 compatibility
- **Build Tool**: React Scripts 5.0.1
- **Container**: Multi-stage Docker (Node.js 24.5.0-alpine + Nginx)
- **State Management**: React Context (no external state library)
- **Routing**: Custom page state management (no React Router)
