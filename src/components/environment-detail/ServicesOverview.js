import React from "react";
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
import { useTheme } from "../../contexts/ThemeContext";
import { getServiceConfig } from "../../config/servicesConfig";

const ServicesOverview = ({ environment }) => {
  const { isDark } = useTheme();

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

  const ServiceItem = ({ serviceName, serviceConfig }) => {
    const serviceDefinition = getServiceConfig(serviceName);
    const IconComponent = getServiceIcon(serviceName);

    return (
      <div
        className={`p-4 rounded-lg border transition-colors ${
          isDark ? "bg-gray-800/50 border-gray-700" : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-5 h-5 text-teal-500" />
            <div>
              <h4 className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {serviceDefinition?.displayName || serviceName}
              </h4>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {serviceDefinition?.description || "Service configuration"}
              </p>
            </div>
          </div>
          <CheckCircle className="w-4 h-4 text-green-400" />
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
        <div className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No services are currently enabled</p>
        </div>
      )}
    </div>
  );
};

export default ServicesOverview;
