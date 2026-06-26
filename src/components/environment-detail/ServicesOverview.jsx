import {
  Database,
  Network,
  Container,
  Archive,
  Shield,
  Box,
  Lock,
  CheckCircle,
  Package,
} from "lucide-react";
import { getServiceConfig } from "../../config/servicesConfig";

const ServicesOverview = ({ environment }) => {
  const getServiceIcon = (serviceName) => {
    const icons = {
      vpc: Network,
      eks: Container,
      rds: Database,
      s3: Archive,
      ecr: Package,
      opensearch: Database,
      lambda: Box,
      elasticache: Database,
      secretsmanager: Lock,
      iam: Shield,
    };
    return icons[serviceName] || Box;
  };

  const enabledServices = Object.entries(environment.services || {})
    .filter(([_, config]) => config?.enabled)
    .sort(([a], [b]) => a.localeCompare(b));

  const ServiceItem = ({ serviceName }) => {
    const serviceDefinition = getServiceConfig(serviceName);
    const IconComponent = getServiceIcon(serviceName);

    return (
      <div className="p-4 rounded-lg border bg-surface border-border transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-primary">
                {serviceDefinition?.displayName || serviceName}
              </h4>
              <p className="text-sm text-secondary">
                {serviceDefinition?.description || "Service configuration"}
              </p>
            </div>
          </div>
          <CheckCircle className="w-4 h-4 text-success" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {enabledServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledServices.map(([serviceName, serviceConfig]) => (
            <ServiceItem
              key={serviceName}
              serviceName={serviceName}
              serviceConfig={serviceConfig}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-secondary">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No services are currently enabled</p>
        </div>
      )}
    </div>
  );
};

export default ServicesOverview;
