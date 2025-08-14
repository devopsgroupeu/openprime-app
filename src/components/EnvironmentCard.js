// src/components/EnvironmentCard.js
import React from 'react';
import { 
  Cloud, Server, Settings, Download, Network, Box, Database, Package, 
  Edit2, Search, Container, Layers, Archive, FunctionSquare, Shield, Bell,
  Globe, Lock, HardDrive, MessageSquare
} from 'lucide-react';

const EnvironmentCard = ({ environment, onEdit }) => {
  const getServiceIcon = (service) => {
    const icons = {
      vpc: <Network className="w-3 h-3 mr-1 text-purple-400" />,
      eks: <Box className="w-3 h-3 mr-1 text-purple-400" />,
      rds: <Database className="w-3 h-3 mr-1 text-purple-400" />,
      opensearch: <Search className="w-3 h-3 mr-1 text-purple-400" />,
      ecr: <Container className="w-3 h-3 mr-1 text-purple-400" />,
      s3: <Archive className="w-3 h-3 mr-1 text-purple-400" />,
      lambda: <FunctionSquare className="w-3 h-3 mr-1 text-purple-400" />,
      elasticache: <HardDrive className="w-3 h-3 mr-1 text-purple-400" />,
      sqs: <MessageSquare className="w-3 h-3 mr-1 text-purple-400" />,
      sns: <Bell className="w-3 h-3 mr-1 text-purple-400" />,
      cloudfront: <Globe className="w-3 h-3 mr-1 text-purple-400" />,
      route53: <Globe className="w-3 h-3 mr-1 text-purple-400" />,
      secretsManager: <Lock className="w-3 h-3 mr-1 text-purple-400" />,
      iam: <Shield className="w-3 h-3 mr-1 text-purple-400" />
    };
    return icons[service] || <Layers className="w-3 h-3 mr-1 text-purple-400" />;
  };

  const getServiceName = (service) => {
    const names = {
      vpc: 'VPC',
      eks: 'EKS',
      rds: 'RDS',
      opensearch: 'OpenSearch',
      ecr: 'ECR',
      s3: 'S3',
      lambda: 'Lambda',
      elasticache: 'ElastiCache',
      sqs: 'SQS',
      sns: 'SNS',
      cloudfront: 'CloudFront',
      route53: 'Route53',
      secretsManager: 'Secrets',
      iam: 'IAM'
    };
    return names[service] || service.toUpperCase();
  };

  const enabledServices = environment.services ? 
    Object.entries(environment.services).filter(([_, config]) => config?.enabled) : [];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:bg-gray-800/70 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{environment.name}</h3>
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center text-gray-400">
              {environment.type === 'aws' ? <Cloud className="w-4 h-4 mr-1" /> : <Server className="w-4 h-4 mr-1" />}
              {environment.type === 'aws' ? 'AWS Cloud' : 'On-Premise'}
            </span>
            <span className="text-gray-400">
              {environment.type === 'aws' ? environment.region : environment.location}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          environment.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {environment.status === 'running' ? 'Running' : 'Pending'}
        </span>
      </div>

      {environment.type === 'aws' && enabledServices.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="text-sm text-gray-300">
            <div className="font-semibold mb-2">AWS Services ({enabledServices.length}):</div>
            <div className="grid grid-cols-3 gap-2">
              {enabledServices.slice(0, 6).map(([service]) => (
                <div key={service} className="flex items-center bg-gray-700/50 rounded px-2 py-1">
                  {getServiceIcon(service)}
                  {getServiceName(service)}
                </div>
              ))}
              {enabledServices.length > 6 && (
                <div className="flex items-center bg-gray-700/50 rounded px-2 py-1 text-gray-400">
                  <span className="text-xs">+{enabledServices.length - 6} more</span>
                </div>
              )}
            </div>
          </div>

          {environment.services.eks?.enabled && environment.services.eks.helmCharts && (
            <div className="text-sm text-gray-300">
              <div className="font-semibold mb-2">Helm Charts:</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(environment.services.eks.helmCharts)
                  .filter(([_, config]) => config.enabled)
                  .slice(0, 4)
                  .map(([chart, config]) => (
                    <div key={chart} className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="flex items-center">
                        <Package className="w-3 h-3 mr-1 text-green-400" />
                        <span className="text-xs">{chart}</span>
                      </span>
                      {config.customValues && (
                        <Edit2 className="w-3 h-3 text-yellow-400" title="Custom values" />
                      )}
                    </div>
                  ))}
                {Object.entries(environment.services.eks.helmCharts)
                  .filter(([_, config]) => config.enabled).length > 4 && (
                  <div className="flex items-center bg-gray-700/50 rounded px-2 py-1 text-gray-400">
                    <span className="text-xs">
                      +{Object.entries(environment.services.eks.helmCharts)
                        .filter(([_, config]) => config.enabled).length - 4} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {environment.services.ecr?.enabled && environment.services.ecr.repositories?.length > 0 && (
            <div className="text-sm text-gray-300">
              <div className="font-semibold mb-2">ECR Repositories:</div>
              <div className="flex flex-wrap gap-1">
                {environment.services.ecr.repositories.map((repo, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {repo.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-2">
        <button 
          onClick={() => onEdit(environment)}
          className="flex-1 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all flex items-center justify-center"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </button>
        <button className="flex-1 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all flex items-center justify-center">
          <Download className="w-4 h-4 mr-2" />
          Download IaC
        </button>
      </div>
    </div>
  );
};

export default EnvironmentCard;