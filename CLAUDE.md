# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenPrime is a React-based infrastructure management platform that allows users to configure and deploy infrastructure environments across multiple cloud providers (AWS, Azure, GCP) and on-premise. The application features a sophisticated visual interface for managing complex infrastructure configurations including cloud services, Kubernetes Helm charts, and deployment pipelines with Keycloak authentication.

## Development Commands

### Essential Commands
- `npm start` - Run development server (http://localhost:3000)
- `npm test` - Run test suite in watch mode
- `npm run build` - Build production bundle
- `npm install` - Install dependencies

### Testing Commands
- `npm test` - Interactive watch mode for all tests
- `npm test -- --coverage` - Run tests with coverage report
- `npm test -- --watchAll=false` - Run tests once without watch mode
- `npm test -- --testPathPattern=wizard` - Run tests matching specific patterns (e.g., wizard tests)
- `npm test src/components/modals/__tests__/` - Run tests in specific directory

### Docker Development
- `docker build .` - Build Docker image (multi-stage: Node 24.5.0-alpine + Nginx)
- `docker-compose up` - Run application in container with live reload (port 3000)
- Production Docker image serves from Nginx on port 8080 with non-root user

### Code Quality
- Remove all `console.log` statements before committing: `grep -r "console.log" src/ --include="*.js"`
- The codebase uses ESLint via react-scripts - errors will appear in development console
- No additional linting commands needed - integrated with `npm start` and `npm run build`

## Architecture Overview

### High-Level Architecture Patterns

**Configuration-Driven Design**: The entire application is driven by configuration files that eliminate hardcoded service definitions:
- `servicesConfig.js` - Schema-based service definitions with validation rules and field types
- `providersConfig.js` - Multi-cloud provider configurations (AWS, Azure, GCP, On-premise)
- `helmChartsConfig.js` - Kubernetes application templates with customizable values
- `environmentsConfig.js` - Default environment templates and Helm chart configurations

**Dynamic Component System**: Uses `DynamicServiceConfig` and `DynamicFieldRenderer` to generate forms programmatically based on service schemas, eliminating the need for hardcoded UI components for each service.

**Authentication Architecture**: Keycloak OIDC integration with PKCE flow:
- `AuthContext.js` - React context managing authentication state and token refresh
- `authService.js` - HTTP client with automatic JWT token handling
- `keycloak.js` - Keycloak client configuration

### Core Application Structure
- **App.js**: Main router component managing page navigation state and environment data with authentication wrapper
- **Navigation.js**: Top-level navigation bar with routing between Home, Environments, and Settings
- **Wizard System**: Multi-step environment creation with `WizardContainer`, `BasicConfigStep`, `ServicesConfigStep`, and `HelmChartsStep`

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

### Multi-Cloud Infrastructure Configuration
The application supports extensive cloud service configuration across providers:

**AWS Services**:
- **Core Infrastructure**: VPC, EKS, RDS, OpenSearch, ECR, S3
- **Compute & Storage**: Lambda, ElastiCache, EFS
- **Networking**: CloudFront, Route53, ALB/NLB
- **Security & Management**: IAM, Secrets Manager, KMS, CloudTrail
- **Messaging**: SQS, SNS

**Azure Services**: AKS, Virtual Networks, Database services, Storage accounts
**GCP Services**: GKE, VPC, Cloud SQL, Cloud Storage
**On-Premise**: Kubernetes clusters, bare metal configurations

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
- **Navigation**: React Router DOM for client-side routing between pages
- **Modals**: Backdrop blur effects with accessibility features

## Important Implementation Details

### Configuration Architecture
The application's strength lies in its configuration-driven architecture that makes adding new services trivial:

**Service Definition Pattern**:
```javascript
// Adding a new service only requires configuration, no new components
const newService = {
  name: 'ServiceName',
  fields: [
    { name: 'enabled', type: 'boolean', default: false },
    { name: 'instanceType', type: 'select', options: [...] },
    { name: 'config', type: 'object', fields: [...] }
  ],
  validation: { ... }
};
```

**Key Configuration Files**:
- `servicesConfig.js` (432 lines) - Schema-based service definitions with validation rules
- `environmentsConfig.js` - Environment templates and Helm chart defaults with extensive examples
- `providersConfig.js` - Multi-cloud provider configurations and region mappings
- `helmChartsConfig.js` - Kubernetes application templates with production-ready defaults

### Environment Configuration Structure
Environments use a deeply nested JSONB-like structure optimized for flexibility:
```javascript
{
  name: 'environment-name',
  provider: 'aws|azure|gcp|onpremise',
  region: 'provider-specific-region',
  services: {
    [serviceName]: {
      enabled: boolean,
      ...serviceSpecificConfig
    }
  },
  helmCharts: {
    [chartName]: {
      enabled: boolean,
      customValues: boolean,
      values: 'yaml-string'
    }
  }
}
```

### Component Architecture Patterns
**Dynamic Rendering System**:
- `DynamicServiceConfig` - Renders service configuration panels based on schema
- `DynamicFieldRenderer` - Handles all field types (text, select, boolean, object, array)
- `ServiceConfiguration` - Shared component for consistent service UI

**Wizard Implementation**:
- `WizardContainer` (455 lines) - Main wizard logic with validation and step management
- `BasicConfigStep` - Provider and region selection
- `ServicesConfigStep` - Dynamic service configuration forms
- `HelmChartsStep` - Kubernetes application selection

**State Management**:
- React Context API with `AuthContext`, `ThemeContext`, `ToastContext`
- Local component state for form data with validation
- No external state management library (Redux, Zustand) - appropriate for app size

### Authentication Integration
- **Keycloak OIDC**: PKCE flow with automatic token refresh
- **JWT Handling**: Automatic token attachment to API requests
- **Role-Based Access**: User roles available in context for authorization
- **Token Lifecycle**: Automatic refresh on expiration with fallback to re-login

### Performance Considerations
- **Large Components**: `EnvironmentDetailPage.js` (820 lines) needs refactoring
- **Bundle Size**: React 19 + Tailwind CSS optimized build
- **Memory Usage**: Context API suitable for current scale, monitor for larger datasets

## Technology Stack
- **Frontend**: React 19.1.1 with modern hooks and Context API
- **Authentication**: Keycloak JS 26.2.0 with OIDC/PKCE flow
- **Styling**: Tailwind CSS 3.3.3 with PostCSS, dark/light themes, and glassmorphism effects
- **Icons**: Lucide React 0.539.0 for consistent iconography
- **Testing**: React Testing Library 16.3.0, Jest with React 19 compatibility, test patterns in `__tests__/`
- **Build Tool**: React Scripts 5.0.1 with Create React App configuration
- **Container**: Multi-stage Docker (Node.js 24.5.0-alpine + Nginx) for production deployment
- **State Management**: React Context API only (AuthContext, ThemeContext, ToastContext)
- **Routing**: React Router DOM v6 with BrowserRouter for navigation
- **Validation**: Custom validation utilities in `utils/configValidator.js`

## Development Workflow

### Adding New Cloud Services
1. **Define Service Schema**: Add service definition to `servicesConfig.js` with field types and validation
2. **Update Provider Config**: Add service to appropriate provider in `providersConfig.js`
3. **Test Dynamic Rendering**: The `DynamicServiceConfig` component will automatically render the new service
4. **Add Validation Rules**: Include any custom validation logic in `configValidator.js`

### Adding New Cloud Providers
1. **Provider Configuration**: Add provider definition to `providersConfig.js` with regions and services
2. **Service Mappings**: Map provider-specific services to generic service types
3. **Authentication**: Update `authService.js` if provider requires different auth handling
4. **Testing**: Add provider-specific test cases in `__tests__/` directories

### Component Refactoring Guidelines
When encountering large components (>400 lines):
1. **Extract Sections**: Move logical sections to separate components in dedicated folders
2. **Maintain Props**: Keep the same prop interface to avoid breaking parent components
3. **Share State**: Use props or context for shared state, avoid prop drilling
4. **Test Coverage**: Ensure extracted components maintain test coverage

### Environment Integration
This frontend connects to:
- **Backend API**: Express.js server with PostgreSQL for environment persistence
- **Authentication**: Keycloak server for user management and OIDC flow
- **Infrastructure**: Template processing system for Terraform/Helm generation

### Performance Optimization
- **Large Lists**: Consider virtualization if environments exceed 100+ items
- **Bundle Analysis**: Use `npm run build` and analyze bundle size regularly
- **Context Optimization**: Split contexts if they become too large or change frequently
