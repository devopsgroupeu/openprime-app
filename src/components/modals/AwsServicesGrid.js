import React from 'react';
import {
  Network, Box, Database, Search, Container, Archive, FunctionSquare,
  HardDrive, MessageSquare, Bell, Plus, X, Package
} from 'lucide-react';
import { helmChartDefaults } from '../../config/environmentsConfig';
import ServiceConfiguration from '../shared/ServiceConfiguration';

const AwsServicesGrid = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onEditHelmValues,
  addECRRepository,
  removeECRRepository,
  addS3Bucket,
  removeS3Bucket
}) => (
  <div className="grid grid-cols-2 gap-3">
    {/* Column 1 - Core Services */}
    <div className="space-y-3">
      {/* VPC Configuration */}
      <ServiceConfiguration
        service="vpc"
        icon={<Network className="w-5 h-5 text-purple-400 mr-2" />}
        title="VPC - Virtual Private Cloud"
        enabled={newEnv.services.vpc.enabled}
        expanded={expandedServices.vpc}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, vpc: {...newEnv.services.vpc, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, vpc: !expandedServices.vpc})}
      >
        <VPCSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* EKS Configuration */}
      <ServiceConfiguration
        service="eks"
        icon={<Box className="w-5 h-5 text-purple-400 mr-2" />}
        title="EKS - Elastic Kubernetes Service"
        enabled={newEnv.services.eks.enabled}
        expanded={expandedServices.eks}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, eks: {...newEnv.services.eks, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, eks: !expandedServices.eks})}
      >
        <EKSSettings
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          onEditHelmValues={onEditHelmValues}
        />
      </ServiceConfiguration>

      {/* RDS Configuration */}
      <ServiceConfiguration
        service="rds"
        icon={<Database className="w-5 h-5 text-purple-400 mr-2" />}
        title="RDS - Relational Database Service"
        enabled={newEnv.services.rds.enabled}
        expanded={expandedServices.rds}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, rds: {...newEnv.services.rds, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, rds: !expandedServices.rds})}
      >
        <RDSSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* OpenSearch Configuration */}
      <ServiceConfiguration
        service="opensearch"
        icon={<Search className="w-5 h-5 text-purple-400 mr-2" />}
        title="OpenSearch - Search & Analytics"
        enabled={newEnv.services.opensearch.enabled}
        expanded={expandedServices.opensearch}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, opensearch: !expandedServices.opensearch})}
      >
        <OpenSearchSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* ECR Configuration */}
      <ServiceConfiguration
        service="ecr"
        icon={<Container className="w-5 h-5 text-purple-400 mr-2" />}
        title="ECR - Elastic Container Registry"
        enabled={newEnv.services.ecr.enabled}
        expanded={expandedServices.ecr}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, ecr: {...newEnv.services.ecr, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, ecr: !expandedServices.ecr})}
      >
        <ECRSettings
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          addRepository={addECRRepository}
          removeRepository={removeECRRepository}
        />
      </ServiceConfiguration>
    </div>

    {/* Column 2 - Additional Services */}
    <div className="space-y-3">
      {/* S3 Configuration */}
      <ServiceConfiguration
        service="s3"
        icon={<Archive className="w-5 h-5 text-purple-400 mr-2" />}
        title="S3 - Simple Storage Service"
        enabled={newEnv.services.s3.enabled}
        expanded={expandedServices.s3}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, s3: {...newEnv.services.s3, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, s3: !expandedServices.s3})}
      >
        <S3Settings
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          addBucket={addS3Bucket}
          removeBucket={removeS3Bucket}
        />
      </ServiceConfiguration>

      {/* Lambda Configuration */}
      <ServiceConfiguration
        service="lambda"
        icon={<FunctionSquare className="w-5 h-5 text-purple-400 mr-2" />}
        title="Lambda - Serverless Functions"
        enabled={newEnv.services.lambda.enabled}
        expanded={expandedServices.lambda}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, lambda: {...newEnv.services.lambda, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, lambda: !expandedServices.lambda})}
      >
        <LambdaSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* ElastiCache Configuration */}
      <ServiceConfiguration
        service="elasticache"
        icon={<HardDrive className="w-5 h-5 text-purple-400 mr-2" />}
        title="ElastiCache - In-Memory Cache"
        enabled={newEnv.services.elasticache.enabled}
        expanded={expandedServices.elasticache}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, elasticache: {...newEnv.services.elasticache, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, elasticache: !expandedServices.elasticache})}
      >
        <ElastiCacheSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* SQS Configuration */}
      <ServiceConfiguration
        service="sqs"
        icon={<MessageSquare className="w-5 h-5 text-purple-400 mr-2" />}
        title="SQS - Simple Queue Service"
        enabled={newEnv.services.sqs.enabled}
        expanded={expandedServices.sqs}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, sqs: {...newEnv.services.sqs, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, sqs: !expandedServices.sqs})}
      >
        <SQSSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>

      {/* SNS Configuration */}
      <ServiceConfiguration
        service="sns"
        icon={<Bell className="w-5 h-5 text-purple-400 mr-2" />}
        title="SNS - Simple Notification Service"
        enabled={newEnv.services.sns.enabled}
        expanded={expandedServices.sns}
        onToggle={(checked) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, sns: {...newEnv.services.sns, enabled: checked}}
        })}
        onExpand={() => setExpandedServices({...expandedServices, sns: !expandedServices.sns})}
      >
        <SNSSettings newEnv={newEnv} setNewEnv={setNewEnv} />
      </ServiceConfiguration>
    </div>
  </div>
);

// VPC Settings Component
const VPCSettings = ({ newEnv, setNewEnv }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">CIDR Block</label>
        <input
          type="text"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vpc.cidr}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, cidr: e.target.value}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Availability Zones</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vpc.azCount}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, azCount: parseInt(e.target.value)}}
          })}
        >
          <option value={1}>1 AZ</option>
          <option value={2}>2 AZs</option>
          <option value={3}>3 AZs</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Public Subnets</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vpc.publicSubnets}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, publicSubnets: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Private Subnets</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vpc.privateSubnets}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, privateSubnets: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">NAT Gateway</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.vpc.natGateway}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, natGateway: e.target.value}}
          })}
        >
          <option value="none">None</option>
          <option value="single">Single NAT</option>
          <option value="one-per-az">One per AZ</option>
        </select>
      </div>
    </div>
    <div className="space-y-2">
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.vpc.enableFlowLogs}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, enableFlowLogs: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Enable VPC Flow Logs</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.vpc.enableVpnGateway}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, enableVpnGateway: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Enable VPN Gateway</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.vpc.enableDnsHostnames}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, vpc: {...newEnv.services.vpc, enableDnsHostnames: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Enable DNS Hostnames</span>
      </label>
    </div>
  </div>
);

// EKS Settings Component
const EKSSettings = ({ newEnv, setNewEnv, onEditHelmValues }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Version</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.eks.version}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, eks: {...newEnv.services.eks, version: e.target.value}}
          })}
        >
          <option value="1.28">1.28</option>
          <option value="1.27">1.27</option>
          <option value="1.26">1.26</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Node Groups</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.eks.nodeGroups}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, eks: {...newEnv.services.eks, nodeGroups: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Min Nodes</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.eks.minNodes}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, eks: {...newEnv.services.eks, minNodes: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Max Nodes</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.eks.maxNodes}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, eks: {...newEnv.services.eks, maxNodes: parseInt(e.target.value)}}
          })}
        />
      </div>
    </div>

    {/* EKS Add-ons */}
    <div>
      <div className="text-sm text-gray-300 font-medium mb-2">EKS Add-ons</div>
      <div className="grid grid-cols-2 gap-2">
        {newEnv.services.eks.addons && Object.entries(newEnv.services.eks.addons).map(([addon, config]) => (
          <label key={addon} className="flex items-center text-xs bg-gray-600 rounded px-2 py-1">
            <input
              type="checkbox"
              className="mr-2 w-3 h-3"
              checked={config.enabled}
              onChange={(e) => setNewEnv({
                ...newEnv,
                services: {
                  ...newEnv.services,
                  eks: {
                    ...newEnv.services.eks,
                    addons: {
                      ...newEnv.services.eks.addons,
                      [addon]: {...config, enabled: e.target.checked}
                    }
                  }
                }
              })}
            />
            <span className="text-gray-300 capitalize">{addon.replace(/([A-Z])/g, ' $1').trim()}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Helm Charts */}
    <div>
      <div className="text-sm text-gray-300 font-medium mb-2">Helm Charts</div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {Object.entries(newEnv.services.eks?.helmCharts || {}).map(([chart, config]) => (
          <div key={chart} className="flex items-center justify-between bg-gray-600 rounded px-2 py-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="mr-2 w-3 h-3"
                checked={config.enabled}
                onChange={(e) => setNewEnv({
                  ...newEnv,
                  services: {
                    ...newEnv.services,
                    eks: {
                      ...newEnv.services.eks,
                      helmCharts: {
                        ...newEnv.services.eks?.helmCharts,
                        [chart]: {...config, enabled: e.target.checked}
                      }
                    }
                  }
                })}
              />
              <Package className="w-3 h-3 text-green-400 mr-1" />
              <span className="text-white text-xs capitalize">{chart}</span>
            </div>
            {config.enabled && (
              <button
                type="button"
                onClick={() => onEditHelmValues(chart, helmChartDefaults[chart] || '')}
                className="px-1 py-0.5 bg-purple-600/30 text-purple-400 rounded text-xs"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// RDS Settings Component
const RDSSettings = ({ newEnv, setNewEnv }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Engine</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.rds.engine}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, engine: e.target.value}}
          })}
        >
          <option value="postgres">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="aurora-postgresql">Aurora PostgreSQL</option>
          <option value="aurora-mysql">Aurora MySQL</option>
          <option value="mariadb">MariaDB</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Instance Class</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.rds.instanceClass}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, instanceClass: e.target.value}}
          })}
        >
          <option value="db.t3.micro">db.t3.micro</option>
          <option value="db.t3.small">db.t3.small</option>
          <option value="db.t3.medium">db.t3.medium</option>
          <option value="db.t3.large">db.t3.large</option>
          <option value="db.r6g.large">db.r6g.large</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Storage (GB)</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.rds.allocatedStorage}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, allocatedStorage: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Backup Retention</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.rds.backupRetention}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, backupRetention: parseInt(e.target.value)}}
          })}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.rds.multiAz}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, multiAz: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Multi-AZ Deployment</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.rds.encrypted}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, encrypted: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Encryption at Rest</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.rds.performanceInsights}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, performanceInsights: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Performance Insights</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.rds.deletionProtection}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, rds: {...newEnv.services.rds, deletionProtection: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Deletion Protection</span>
      </label>
    </div>
  </div>
);

// OpenSearch Settings Component
const OpenSearchSettings = ({ newEnv, setNewEnv }) => (
  <div className="space-y-3 mt-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Version</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.opensearch.version}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, version: e.target.value}}
          })}
        >
          <option value="2.11">OpenSearch 2.11</option>
          <option value="2.9">OpenSearch 2.9</option>
          <option value="2.7">OpenSearch 2.7</option>
          <option value="1.3">OpenSearch 1.3</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Instance Type</label>
        <select
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.opensearch.instanceType}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, instanceType: e.target.value}}
          })}
        >
          <option value="t3.small.search">t3.small.search</option>
          <option value="t3.medium.search">t3.medium.search</option>
          <option value="m5.large.search">m5.large.search</option>
          <option value="m5.xlarge.search">m5.xlarge.search</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Instance Count</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.opensearch.instanceCount}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, instanceCount: parseInt(e.target.value)}}
          })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">EBS Volume Size (GB)</label>
        <input
          type="number"
          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
          value={newEnv.services.opensearch.ebsVolumeSize}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, ebsVolumeSize: parseInt(e.target.value)}}
          })}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.opensearch.dedicatedMasterEnabled}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, dedicatedMasterEnabled: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Dedicated Master Nodes</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.opensearch.nodeToNodeEncryption}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, nodeToNodeEncryption: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Node-to-Node Encryption</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.opensearch.fineGrainedAccessControl}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, fineGrainedAccessControl: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Fine-Grained Access Control</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.opensearch.cognitoEnabled}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, opensearch: {...newEnv.services.opensearch, cognitoEnabled: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Cognito Authentication</span>
      </label>
    </div>
  </div>
);

// ECR Settings Component
const ECRSettings = ({ newEnv, setNewEnv, addRepository, removeRepository }) => (
  <div className="space-y-3 mt-3">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-300 font-medium">Repositories</div>
      <button
        type="button"
        onClick={addRepository}
        className="px-2 py-1 bg-purple-600/30 text-purple-400 rounded text-xs hover:bg-purple-600/50 flex items-center"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Repository
      </button>
    </div>
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {newEnv.services.ecr.repositories && newEnv.services.ecr.repositories.map((repo, index) => (
        <div key={index} className="flex items-center gap-2 bg-gray-600 rounded p-2">
          <input
            type="text"
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs"
            placeholder="Repository name"
            value={repo.name}
            onChange={(e) => {
              const repos = [...newEnv.services.ecr.repositories];
              repos[index].name = e.target.value;
              setNewEnv({
                ...newEnv,
                services: {...newEnv.services, ecr: {...newEnv.services.ecr, repositories: repos}}
              });
            }}
          />
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              className="mr-1"
              checked={repo.scanOnPush}
              onChange={(e) => {
                const repos = [...newEnv.services.ecr.repositories];
                repos[index].scanOnPush = e.target.checked;
                setNewEnv({
                  ...newEnv,
                  services: {...newEnv.services, ecr: {...newEnv.services.ecr, repositories: repos}}
                });
              }}
            />
            <span className="text-gray-300">Scan on Push</span>
          </label>
          <button
            type="button"
            onClick={() => removeRepository(index)}
            className="p-1 text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.ecr.lifecyclePolicy}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, ecr: {...newEnv.services.ecr, lifecyclePolicy: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Lifecycle Policy</span>
      </label>
      <label className="flex items-center text-xs">
        <input
          type="checkbox"
          className="mr-2"
          checked={newEnv.services.ecr.crossRegionReplication}
          onChange={(e) => setNewEnv({
            ...newEnv,
            services: {...newEnv.services, ecr: {...newEnv.services.ecr, crossRegionReplication: e.target.checked}}
          })}
        />
        <span className="text-gray-300">Cross-Region Replication</span>
      </label>
    </div>
  </div>
);

// S3 Settings Component
const S3Settings = ({ newEnv, setNewEnv, addBucket, removeBucket }) => (
  <div className="space-y-3 mt-3">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-300 font-medium">Buckets</div>
      <button
        type="button"
        onClick={addBucket}
        className="px-2 py-1 bg-purple-600/30 text-purple-400 rounded text-xs hover:bg-purple-600/50 flex items-center"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Bucket
      </button>
    </div>
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {newEnv.services.s3.buckets && newEnv.services.s3.buckets.map((bucket, index) => (
        <div key={index} className="bg-gray-600 rounded p-2">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs"
              placeholder="Bucket name"
              value={bucket.name}
              onChange={(e) => {
                const buckets = [...newEnv.services.s3.buckets];
                buckets[index].name = e.target.value;
                setNewEnv({
                  ...newEnv,
                  services: {...newEnv.services, s3: {...newEnv.services.s3, buckets}}
                });
              }}
            />
            <select
              className="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-xs"
              value={bucket.encryption}
              onChange={(e) => {
                const buckets = [...newEnv.services.s3.buckets];
                buckets[index].encryption = e.target.value;
                setNewEnv({
                  ...newEnv,
                  services: {...newEnv.services, s3: {...newEnv.services.s3, buckets}}
                });
              }}
            >
              <option value="AES256">AES256</option>
              <option value="KMS">KMS</option>
            </select>
            <button
              type="button"
              onClick={() => removeBucket(index)}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                className="mr-1"
                checked={bucket.versioning}
                onChange={(e) => {
                  const buckets = [...newEnv.services.s3.buckets];
                  buckets[index].versioning = e.target.checked;
                  setNewEnv({
                    ...newEnv,
                    services: {...newEnv.services, s3: {...newEnv.services.s3, buckets}}
                  });
                }}
              />
              <span className="text-gray-300">Versioning</span>
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                className="mr-1"
                checked={bucket.lifecycleRules}
                onChange={(e) => {
                  const buckets = [...newEnv.services.s3.buckets];
                  buckets[index].lifecycleRules = e.target.checked;
                  setNewEnv({
                    ...newEnv,
                    services: {...newEnv.services, s3: {...newEnv.services.s3, buckets}}
                  });
                }}
              />
              <span className="text-gray-300">Lifecycle</span>
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                className="mr-1"
                checked={bucket.replication}
                onChange={(e) => {
                  const buckets = [...newEnv.services.s3.buckets];
                  buckets[index].replication = e.target.checked;
                  setNewEnv({
                    ...newEnv,
                    services: {...newEnv.services, s3: {...newEnv.services.s3, buckets}}
                  });
                }}
              />
              <span className="text-gray-300">Replication</span>
            </label>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Lambda Settings Component
const LambdaSettings = ({ newEnv, setNewEnv }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs text-gray-400 mb-1">Default Runtime</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.lambda.defaultRuntime}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, lambda: {...newEnv.services.lambda, defaultRuntime: e.target.value}}
        })}
      >
        <option value="nodejs18.x">Node.js 18.x</option>
        <option value="python3.11">Python 3.11</option>
        <option value="java17">Java 17</option>
        <option value="dotnet6">dotnet 6</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Default Memory (MB)</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.lambda.defaultMemory}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, lambda: {...newEnv.services.lambda, defaultMemory: parseInt(e.target.value)}}
        })}
      >
        <option value={128}>128 MB</option>
        <option value={256}>256 MB</option>
        <option value={512}>512 MB</option>
        <option value={1024}>1024 MB</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Default Timeout (sec)</label>
      <input
        type="number"
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.lambda.defaultTimeout}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, lambda: {...newEnv.services.lambda, defaultTimeout: parseInt(e.target.value)}}
        })}
      />
    </div>
  </div>
);

// ElastiCache Settings Component
const ElastiCacheSettings = ({ newEnv, setNewEnv }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs text-gray-400 mb-1">Engine</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.elasticache.engine}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, elasticache: {...newEnv.services.elasticache, engine: e.target.value}}
        })}
      >
        <option value="redis">Redis</option>
        <option value="memcached">Memcached</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Node Type</label>
      <select
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.elasticache.nodeType}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, elasticache: {...newEnv.services.elasticache, nodeType: e.target.value}}
        })}
      >
        <option value="cache.t3.micro">cache.t3.micro</option>
        <option value="cache.t3.small">cache.t3.small</option>
        <option value="cache.t3.medium">cache.t3.medium</option>
      </select>
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Number of Nodes</label>
      <input
        type="number"
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.elasticache.numCacheNodes}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, elasticache: {...newEnv.services.elasticache, numCacheNodes: parseInt(e.target.value)}}
        })}
      />
    </div>
  </div>
);

// SQS Settings Component
const SQSSettings = ({ newEnv, setNewEnv }) => (
  <div className="grid grid-cols-2 gap-3 mt-3">
    <div>
      <label className="block text-xs text-gray-400 mb-1">Visibility Timeout (sec)</label>
      <input
        type="number"
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.sqs.defaultVisibilityTimeout}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, sqs: {...newEnv.services.sqs, defaultVisibilityTimeout: parseInt(e.target.value)}}
        })}
      />
    </div>
    <div>
      <label className="block text-xs text-gray-400 mb-1">Message Retention (sec)</label>
      <input
        type="number"
        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
        value={newEnv.services.sqs.defaultMessageRetention}
        onChange={(e) => setNewEnv({
          ...newEnv,
          services: {...newEnv.services, sqs: {...newEnv.services.sqs, defaultMessageRetention: parseInt(e.target.value)}}
        })}
      />
    </div>
  </div>
);

// SNS Settings Component
const SNSSettings = ({ newEnv, setNewEnv }) => (
  <div className="mt-3">
    <label className="block text-xs text-gray-400 mb-1">Default KMS Key ID</label>
    <input
      type="text"
      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
      placeholder="KMS Key ID (optional)"
      value={newEnv.services.sns.defaultKmsKeyId || ''}
      onChange={(e) => setNewEnv({
        ...newEnv,
        services: {...newEnv.services, sns: {...newEnv.services.sns, defaultKmsKeyId: e.target.value}}
      })}
    />
  </div>
);

export default AwsServicesGrid;
