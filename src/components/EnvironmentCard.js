// src/components/EnvironmentCard.js
import React, { useState } from "react";
import {
  Cloud,
  Server,
  Settings,
  Download,
  Network,
  Box,
  Database,
  Package,
  Edit2,
  Search,
  Container,
  Layers,
  Archive,
  FunctionSquare,
  Shield,
  Bell,
  Globe,
  Lock,
  HardDrive,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

const EnvironmentCard = ({ environment, onEdit, onDelete, onClick }) => {
  const { isDark } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const getServiceIcon = (service) => {
    const icons = {
      // AWS Services
      vpc: <Network className="w-3 h-3 mr-1 text-primary" />,
      eks: <Box className="w-3 h-3 mr-1 text-primary" />,
      rds: <Database className="w-3 h-3 mr-1 text-primary" />,
      opensearch: <Search className="w-3 h-3 mr-1 text-primary" />,
      ecr: <Container className="w-3 h-3 mr-1 text-primary" />,
      s3: <Archive className="w-3 h-3 mr-1 text-primary" />,
      lambda: <FunctionSquare className="w-3 h-3 mr-1 text-primary" />,
      elasticache: <HardDrive className="w-3 h-3 mr-1 text-primary" />,
      sqs: <MessageSquare className="w-3 h-3 mr-1 text-primary" />,
      sns: <Bell className="w-3 h-3 mr-1 text-primary" />,
      cloudfront: <Globe className="w-3 h-3 mr-1 text-primary" />,
      route53: <Globe className="w-3 h-3 mr-1 text-primary" />,
      secretsManager: <Lock className="w-3 h-3 mr-1 text-primary" />,
      iam: <Shield className="w-3 h-3 mr-1 text-primary" />,
      // Azure Services
      vnet: <Network className="w-3 h-3 mr-1 text-blue-400" />,
      aks: <Box className="w-3 h-3 mr-1 text-blue-400" />,
      sqlDatabase: <Database className="w-3 h-3 mr-1 text-blue-400" />,
      cosmosDb: <Database className="w-3 h-3 mr-1 text-blue-400" />,
      containerRegistry: <Container className="w-3 h-3 mr-1 text-blue-400" />,
      storageAccount: <Archive className="w-3 h-3 mr-1 text-blue-400" />,
      functions: <FunctionSquare className="w-3 h-3 mr-1 text-blue-400" />,
      redis: <HardDrive className="w-3 h-3 mr-1 text-blue-400" />,
      serviceBus: <MessageSquare className="w-3 h-3 mr-1 text-blue-400" />,
      keyVault: <Lock className="w-3 h-3 mr-1 text-blue-400" />,
    };
    return icons[service] || <Layers className="w-3 h-3 mr-1 text-primary" />;
  };

  const getServiceName = (service) => {
    const names = {
      // AWS Services
      vpc: "VPC",
      eks: "EKS",
      rds: "RDS",
      opensearch: "OpenSearch",
      ecr: "ECR",
      s3: "S3",
      lambda: "Lambda",
      elasticache: "ElastiCache",
      sqs: "SQS",
      sns: "SNS",
      cloudfront: "CloudFront",
      route53: "Route53",
      secretsManager: "Secrets",
      iam: "IAM",
      // Azure Services
      vnet: "VNet",
      aks: "AKS",
      sqlDatabase: "SQL Database",
      cosmosDb: "Cosmos DB",
      containerRegistry: "Container Registry",
      storageAccount: "Storage Account",
      functions: "Functions",
      redis: "Redis Cache",
      serviceBus: "Service Bus",
      keyVault: "Key Vault",
    };
    return names[service] || service.toUpperCase();
  };

  const enabledServices = environment.services
    ? Object.entries(environment.services).filter(
        ([_, config]) => config?.enabled,
      )
    : [];

  const handleDeleteConfirm = () => {
    onDelete(environment.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div
        className={`backdrop-blur-sm rounded-xl border p-6 transition-all cursor-pointer ${
          isDark
            ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600"
            : "bg-white/70 border-gray-200 hover:bg-white/90 hover:border-gray-300"
        } hover:shadow-lg hover:scale-[1.02]`}
        onClick={() => onClick?.(environment)}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3
              className={`text-xl font-bold mb-1 transition-colors ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {environment.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <span
                className={`flex items-center transition-colors ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {environment.provider === "aws" ? (
                  <Cloud className="w-4 h-4 mr-1" />
                ) : environment.provider === "azure" ? (
                  <Cloud className="w-4 h-4 mr-1" />
                ) : (
                  <Server className="w-4 h-4 mr-1" />
                )}
                {environment.provider === "aws"
                  ? "AWS Cloud"
                  : environment.provider === "azure"
                    ? "Azure Cloud"
                    : "On-Premise"}
              </span>
              <span
                className={`transition-colors ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {environment.provider === "aws" ||
                environment.provider === "azure"
                  ? environment.region
                  : environment.location}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              environment.status === "running"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {environment.status === "running" ? "Running" : "Pending"}
          </span>
        </div>

        {(environment.provider === "aws" || environment.provider === "azure") &&
          enabledServices.length > 0 && (
            <div className="space-y-3 mb-4">
              <div
                className={`text-sm transition-colors ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="font-semibold mb-2">
                  {environment.provider === "azure" ? "Azure" : "AWS"} Services
                  ({enabledServices.length}):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {enabledServices.slice(0, 6).map(([service]) => (
                    <div
                      key={service}
                      className={`flex items-center rounded px-2 py-1 transition-colors ${
                        isDark ? "bg-gray-700/50" : "bg-gray-100"
                      }`}
                    >
                      {getServiceIcon(service)}
                      {getServiceName(service)}
                    </div>
                  ))}
                  {enabledServices.length > 6 && (
                    <div
                      className={`flex items-center rounded px-2 py-1 transition-colors ${
                        isDark
                          ? "bg-gray-700/50 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="text-xs">
                        +{enabledServices.length - 6} more
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {((environment.services.eks?.enabled &&
                environment.services.eks.helmCharts) ||
                (environment.services.aks?.enabled &&
                  environment.services.aks.helmCharts)) && (
                <div
                  className={`text-sm transition-colors ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <div className="font-semibold mb-2">Helm Charts:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(
                      (environment.services.eks || environment.services.aks)
                        ?.helmCharts || {},
                    )
                      .filter(([_, config]) => config.enabled)
                      .slice(0, 4)
                      .map(([chart, config]) => (
                        <div
                          key={chart}
                          className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
                            isDark ? "bg-gray-700/50" : "bg-gray-100"
                          }`}
                        >
                          <span className="flex items-center">
                            <Package className="w-3 h-3 mr-1 text-green-400" />
                            <span className="text-xs">{chart}</span>
                          </span>
                          {config.customValues && (
                            <Edit2
                              className="w-3 h-3 text-yellow-400"
                              title="Custom values"
                            />
                          )}
                        </div>
                      ))}
                    {Object.entries(
                      (environment.services.eks || environment.services.aks)
                        ?.helmCharts || {},
                    ).filter(([_, config]) => config.enabled).length > 4 && (
                      <div
                        className={`flex items-center rounded px-2 py-1 transition-colors ${
                          isDark
                            ? "bg-gray-700/50 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span className="text-xs">
                          +
                          {Object.entries(
                            (
                              environment.services.eks ||
                              environment.services.aks
                            )?.helmCharts || {},
                          ).filter(([_, config]) => config.enabled).length -
                            4}{" "}
                          more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {((environment.services.ecr?.enabled &&
                environment.services.ecr.repositories?.length > 0) ||
                (environment.services.containerRegistry?.enabled &&
                  environment.services.containerRegistry.repositories?.length >
                    0)) && (
                <div
                  className={`text-sm transition-colors ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <div className="font-semibold mb-2">
                    {environment.provider === "azure"
                      ? "Container Registry Repositories:"
                      : "ECR Repositories:"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(
                      environment.services.ecr?.repositories ||
                      environment.services.containerRegistry?.repositories ||
                      []
                    ).map((repo, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                      >
                        {repo.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(environment)}
            className="flex-1 px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg hover:bg-teal-600/30 transition-all flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Download IaC
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default EnvironmentCard;
