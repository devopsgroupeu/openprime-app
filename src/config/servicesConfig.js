// src/config/servicesConfig.js

export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  TOGGLE: 'toggle',
  DROPDOWN: 'dropdown',
  MULTISELECT: 'multiselect',
  TEXTAREA: 'textarea',
  ARRAY: 'array',
  OBJECT: 'object'
};

export const SERVICES_CONFIG = {
  // AWS Services
  vpc: {
    name: 'vpc',
    displayName: 'Virtual Private Cloud (VPC)',
    description: 'AWS Virtual Private Cloud for network isolation',
    provider: 'aws',
    category: 'Networking',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable VPC', description: 'Enable VPC service', defaultValue: false },
      cidr: { type: FIELD_TYPES.TEXT, name: 'cidr', displayName: 'CIDR Block', description: 'The CIDR block for the VPC', defaultValue: '10.0.0.0/16', validation: { pattern: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ } },
      azCount: { type: FIELD_TYPES.DROPDOWN, name: 'azCount', displayName: 'Availability Zones', description: 'Number of availability zones', defaultValue: 2, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }] },
      publicSubnets: { type: FIELD_TYPES.NUMBER, name: 'publicSubnets', displayName: 'Public Subnets', description: 'Number of public subnets', defaultValue: 2, min: 0, max: 10 },
      privateSubnets: { type: FIELD_TYPES.NUMBER, name: 'privateSubnets', displayName: 'Private Subnets', description: 'Number of private subnets', defaultValue: 2, min: 0, max: 10 },
      natGateway: { type: FIELD_TYPES.DROPDOWN, name: 'natGateway', displayName: 'NAT Gateway', description: 'NAT Gateway configuration', defaultValue: 'single', options: [{ value: 'none', label: 'None' }, { value: 'single', label: 'Single NAT Gateway' }, { value: 'one-per-az', label: 'One per AZ' }] },
      enableVpnGateway: { type: FIELD_TYPES.TOGGLE, name: 'enableVpnGateway', displayName: 'VPN Gateway', description: 'Enable VPN Gateway', defaultValue: false },
      enableFlowLogs: { type: FIELD_TYPES.TOGGLE, name: 'enableFlowLogs', displayName: 'Flow Logs', description: 'Enable VPC Flow Logs', defaultValue: true },
      enableDnsHostnames: { type: FIELD_TYPES.TOGGLE, name: 'enableDnsHostnames', displayName: 'DNS Hostnames', description: 'Enable DNS hostnames', defaultValue: true },
      enableDnsSupport: { type: FIELD_TYPES.TOGGLE, name: 'enableDnsSupport', displayName: 'DNS Support', description: 'Enable DNS support', defaultValue: true }
    }
  },

  eks: {
    name: 'eks',
    displayName: 'Elastic Kubernetes Service (EKS)',
    description: 'Managed Kubernetes service from AWS',
    provider: 'aws',
    category: 'Compute',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable EKS', description: 'Enable EKS service', defaultValue: false },
      version: { type: FIELD_TYPES.DROPDOWN, name: 'version', displayName: 'Kubernetes Version', description: 'Kubernetes version', defaultValue: '1.28', options: [{ value: '1.26', label: '1.26' }, { value: '1.27', label: '1.27' }, { value: '1.28', label: '1.28' }, { value: '1.29', label: '1.29' }] },
      nodeGroups: { type: FIELD_TYPES.NUMBER, name: 'nodeGroups', displayName: 'Node Groups', description: 'Number of node groups', defaultValue: 1, min: 1, max: 10 },
      minNodes: { type: FIELD_TYPES.NUMBER, name: 'minNodes', displayName: 'Min Nodes', description: 'Minimum number of nodes', defaultValue: 2, min: 1, max: 100 },
      maxNodes: { type: FIELD_TYPES.NUMBER, name: 'maxNodes', displayName: 'Max Nodes', description: 'Maximum number of nodes', defaultValue: 5, min: 1, max: 100 },
      instanceTypes: { type: FIELD_TYPES.MULTISELECT, name: 'instanceTypes', displayName: 'Instance Types', description: 'EC2 instance types', defaultValue: ['t3.medium'], options: [{ value: 't3.micro', label: 't3.micro' }, { value: 't3.small', label: 't3.small' }, { value: 't3.medium', label: 't3.medium' }, { value: 't3.large', label: 't3.large' }, { value: 't3.xlarge', label: 't3.xlarge' }, { value: 'm5.large', label: 'm5.large' }, { value: 'm5.xlarge', label: 'm5.xlarge' }, { value: 'c5.large', label: 'c5.large' }, { value: 'c5.xlarge', label: 'c5.xlarge' }] },
      diskSize: { type: FIELD_TYPES.NUMBER, name: 'diskSize', displayName: 'Disk Size (GB)', description: 'EBS volume size in GB', defaultValue: 50, min: 20, max: 1000 },
      enableAutoScaling: { type: FIELD_TYPES.TOGGLE, name: 'enableAutoScaling', displayName: 'Auto Scaling', description: 'Enable node auto scaling', defaultValue: true },
      enableClusterAutoscaler: { type: FIELD_TYPES.TOGGLE, name: 'enableClusterAutoscaler', displayName: 'Cluster Autoscaler', description: 'Enable cluster autoscaler', defaultValue: false },
      enableMetricsServer: { type: FIELD_TYPES.TOGGLE, name: 'enableMetricsServer', displayName: 'Metrics Server', description: 'Enable metrics server', defaultValue: true },
      addons: { type: FIELD_TYPES.OBJECT, name: 'addons', displayName: 'EKS Addons', description: 'EKS managed addons' }
    }
  },

  rds: {
    name: 'rds',
    displayName: 'Relational Database Service (RDS)',
    description: 'Managed relational database service',
    provider: 'aws',
    category: 'Database',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable RDS', description: 'Enable RDS service', defaultValue: false },
      engine: { type: FIELD_TYPES.DROPDOWN, name: 'engine', displayName: 'Database Engine', description: 'Database engine type', defaultValue: 'postgres', options: [{ value: 'postgres', label: 'PostgreSQL' }, { value: 'mysql', label: 'MySQL' }, { value: 'mariadb', label: 'MariaDB' }, { value: 'oracle-ee', label: 'Oracle' }, { value: 'sqlserver-ex', label: 'SQL Server' }] },
      version: { type: FIELD_TYPES.TEXT, name: 'version', displayName: 'Engine Version', description: 'Database engine version', defaultValue: '15.4' },
      instanceClass: { type: FIELD_TYPES.DROPDOWN, name: 'instanceClass', displayName: 'Instance Class', description: 'RDS instance class', defaultValue: 'db.t3.small', options: [{ value: 'db.t3.micro', label: 'db.t3.micro' }, { value: 'db.t3.small', label: 'db.t3.small' }, { value: 'db.t3.medium', label: 'db.t3.medium' }, { value: 'db.t3.large', label: 'db.t3.large' }, { value: 'db.r5.large', label: 'db.r5.large' }, { value: 'db.r5.xlarge', label: 'db.r5.xlarge' }] },
      allocatedStorage: { type: FIELD_TYPES.NUMBER, name: 'allocatedStorage', displayName: 'Storage (GB)', description: 'Allocated storage in GB', defaultValue: 20, min: 20, max: 1000 },
      maxAllocatedStorage: { type: FIELD_TYPES.NUMBER, name: 'maxAllocatedStorage', displayName: 'Max Storage (GB)', description: 'Maximum allocated storage in GB', defaultValue: 100, min: 20, max: 10000 },
      multiAz: { type: FIELD_TYPES.TOGGLE, name: 'multiAz', displayName: 'Multi-AZ', description: 'Enable Multi-AZ deployment', defaultValue: false },
      backupRetention: { type: FIELD_TYPES.NUMBER, name: 'backupRetention', displayName: 'Backup Retention (days)', description: 'Backup retention period in days', defaultValue: 7, min: 0, max: 35 },
      encrypted: { type: FIELD_TYPES.TOGGLE, name: 'encrypted', displayName: 'Encryption', description: 'Enable encryption at rest', defaultValue: true },
      deletionProtection: { type: FIELD_TYPES.TOGGLE, name: 'deletionProtection', displayName: 'Deletion Protection', description: 'Enable deletion protection', defaultValue: false },
      performanceInsights: { type: FIELD_TYPES.TOGGLE, name: 'performanceInsights', displayName: 'Performance Insights', description: 'Enable Performance Insights', defaultValue: false },
      enhancedMonitoring: { type: FIELD_TYPES.TOGGLE, name: 'enhancedMonitoring', displayName: 'Enhanced Monitoring', description: 'Enable enhanced monitoring', defaultValue: false }
    }
  },

  // Azure Services
  vnet: {
    name: 'vnet',
    displayName: 'Virtual Network (VNet)',
    description: 'Azure Virtual Network for network isolation',
    provider: 'azure',
    category: 'Networking',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable VNet', description: 'Enable VNet service', defaultValue: false },
      addressSpace: { type: FIELD_TYPES.TEXT, name: 'addressSpace', displayName: 'Address Space', description: 'The address space for the VNet', defaultValue: '10.0.0.0/16', validation: { pattern: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ } },
      subnets: { type: FIELD_TYPES.OBJECT, name: 'subnets', displayName: 'Subnets', description: 'Subnet configurations' },
      enableDdosProtection: { type: FIELD_TYPES.TOGGLE, name: 'enableDdosProtection', displayName: 'DDoS Protection', description: 'Enable DDoS protection', defaultValue: false },
      enableVmProtection: { type: FIELD_TYPES.TOGGLE, name: 'enableVmProtection', displayName: 'VM Protection', description: 'Enable VM protection', defaultValue: false }
    }
  },

  aks: {
    name: 'aks',
    displayName: 'Azure Kubernetes Service (AKS)',
    description: 'Managed Kubernetes service from Azure',
    provider: 'azure',
    category: 'Compute',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable AKS', description: 'Enable AKS service', defaultValue: false },
      version: { type: FIELD_TYPES.DROPDOWN, name: 'version', displayName: 'Kubernetes Version', description: 'Kubernetes version', defaultValue: '1.28', options: [{ value: '1.26', label: '1.26' }, { value: '1.27', label: '1.27' }, { value: '1.28', label: '1.28' }, { value: '1.29', label: '1.29' }] },
      nodeGroups: { type: FIELD_TYPES.NUMBER, name: 'nodeGroups', displayName: 'Node Pools', description: 'Number of node pools', defaultValue: 1, min: 1, max: 10 },
      minNodes: { type: FIELD_TYPES.NUMBER, name: 'minNodes', displayName: 'Min Nodes', description: 'Minimum number of nodes', defaultValue: 2, min: 1, max: 100 },
      maxNodes: { type: FIELD_TYPES.NUMBER, name: 'maxNodes', displayName: 'Max Nodes', description: 'Maximum number of nodes', defaultValue: 5, min: 1, max: 100 },
      vmSize: { type: FIELD_TYPES.DROPDOWN, name: 'vmSize', displayName: 'VM Size', description: 'Azure VM size', defaultValue: 'Standard_D2s_v3', options: [{ value: 'Standard_B2s', label: 'Standard_B2s' }, { value: 'Standard_D2s_v3', label: 'Standard_D2s_v3' }, { value: 'Standard_D4s_v3', label: 'Standard_D4s_v3' }, { value: 'Standard_D8s_v3', label: 'Standard_D8s_v3' }] },
      diskSize: { type: FIELD_TYPES.NUMBER, name: 'diskSize', displayName: 'Disk Size (GB)', description: 'OS disk size in GB', defaultValue: 50, min: 30, max: 1000 },
      enableAutoScaling: { type: FIELD_TYPES.TOGGLE, name: 'enableAutoScaling', displayName: 'Auto Scaling', description: 'Enable node auto scaling', defaultValue: true },
      enableClusterAutoscaler: { type: FIELD_TYPES.TOGGLE, name: 'enableClusterAutoscaler', displayName: 'Cluster Autoscaler', description: 'Enable cluster autoscaler', defaultValue: false },
      enableMetricsServer: { type: FIELD_TYPES.TOGGLE, name: 'enableMetricsServer', displayName: 'Metrics Server', description: 'Enable metrics server', defaultValue: true },
      addons: { type: FIELD_TYPES.OBJECT, name: 'addons', displayName: 'AKS Addons', description: 'AKS managed addons' }
    }
  },

  sqlDatabase: {
    name: 'sqlDatabase',
    displayName: 'Azure SQL Database',
    description: 'Managed SQL database service',
    provider: 'azure',
    category: 'Database',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable SQL Database', description: 'Enable Azure SQL Database', defaultValue: false },
      tier: { type: FIELD_TYPES.DROPDOWN, name: 'tier', displayName: 'Service Tier', description: 'Database service tier', defaultValue: 'Basic', options: [{ value: 'Basic', label: 'Basic' }, { value: 'Standard', label: 'Standard' }, { value: 'Premium', label: 'Premium' }, { value: 'GeneralPurpose', label: 'General Purpose' }, { value: 'BusinessCritical', label: 'Business Critical' }] },
      size: { type: FIELD_TYPES.TEXT, name: 'size', displayName: 'Compute Size', description: 'Database compute size', defaultValue: 'S0' },
      maxStorage: { type: FIELD_TYPES.NUMBER, name: 'maxStorage', displayName: 'Max Storage (GB)', description: 'Maximum storage in GB', defaultValue: 2, min: 1, max: 1000 },
      enableBackup: { type: FIELD_TYPES.TOGGLE, name: 'enableBackup', displayName: 'Automated Backup', description: 'Enable automated backup', defaultValue: true },
      backupRetention: { type: FIELD_TYPES.NUMBER, name: 'backupRetention', displayName: 'Backup Retention (days)', description: 'Backup retention period in days', defaultValue: 7, min: 1, max: 35 },
      enableEncryption: { type: FIELD_TYPES.TOGGLE, name: 'enableEncryption', displayName: 'Encryption', description: 'Enable encryption at rest', defaultValue: true },
      enableAdvancedThreatProtection: { type: FIELD_TYPES.TOGGLE, name: 'enableAdvancedThreatProtection', displayName: 'Advanced Threat Protection', description: 'Enable advanced threat protection', defaultValue: false },
      enableAudit: { type: FIELD_TYPES.TOGGLE, name: 'enableAudit', displayName: 'Auditing', description: 'Enable database auditing', defaultValue: false }
    }
  },

  // More AWS Services
  opensearch: {
    name: 'opensearch',
    displayName: 'OpenSearch Service',
    description: 'Managed search and analytics service',
    provider: 'aws',
    category: 'Database',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable OpenSearch', description: 'Enable OpenSearch service', defaultValue: false },
      version: { type: FIELD_TYPES.DROPDOWN, name: 'version', displayName: 'OpenSearch Version', description: 'OpenSearch version', defaultValue: '2.11', options: [{ value: '2.11', label: '2.11' }, { value: '2.9', label: '2.9' }, { value: '2.7', label: '2.7' }, { value: '1.3', label: '1.3' }] },
      instanceType: { type: FIELD_TYPES.DROPDOWN, name: 'instanceType', displayName: 'Instance Type', description: 'OpenSearch instance type', defaultValue: 't3.small.search', options: [{ value: 't3.small.search', label: 't3.small.search' }, { value: 't3.medium.search', label: 't3.medium.search' }, { value: 'm5.large.search', label: 'm5.large.search' }, { value: 'm5.xlarge.search', label: 'm5.xlarge.search' }] },
      instanceCount: { type: FIELD_TYPES.NUMBER, name: 'instanceCount', displayName: 'Instance Count', description: 'Number of data instances', defaultValue: 1, min: 1, max: 20 },
      dedicatedMasterEnabled: { type: FIELD_TYPES.TOGGLE, name: 'dedicatedMasterEnabled', displayName: 'Dedicated Master', description: 'Enable dedicated master nodes', defaultValue: false },
      dedicatedMasterType: { type: FIELD_TYPES.DROPDOWN, name: 'dedicatedMasterType', displayName: 'Master Instance Type', description: 'Master node instance type', defaultValue: 't3.small.search', options: [{ value: 't3.small.search', label: 't3.small.search' }, { value: 't3.medium.search', label: 't3.medium.search' }, { value: 'm5.large.search', label: 'm5.large.search' }] },
      dedicatedMasterCount: { type: FIELD_TYPES.NUMBER, name: 'dedicatedMasterCount', displayName: 'Master Node Count', description: 'Number of master nodes', defaultValue: 0, min: 0, max: 5 },
      ebsVolumeSize: { type: FIELD_TYPES.NUMBER, name: 'ebsVolumeSize', displayName: 'EBS Volume Size (GB)', description: 'EBS volume size per instance', defaultValue: 10, min: 10, max: 1000 },
      ebsVolumeType: { type: FIELD_TYPES.DROPDOWN, name: 'ebsVolumeType', displayName: 'EBS Volume Type', description: 'EBS volume type', defaultValue: 'gp3', options: [{ value: 'gp3', label: 'gp3' }, { value: 'gp2', label: 'gp2' }, { value: 'io1', label: 'io1' }] },
      encrypted: { type: FIELD_TYPES.TOGGLE, name: 'encrypted', displayName: 'Encryption at Rest', description: 'Enable encryption at rest', defaultValue: true },
      nodeToNodeEncryption: { type: FIELD_TYPES.TOGGLE, name: 'nodeToNodeEncryption', displayName: 'Node-to-Node Encryption', description: 'Enable node-to-node encryption', defaultValue: true },
      fineGrainedAccessControl: { type: FIELD_TYPES.TOGGLE, name: 'fineGrainedAccessControl', displayName: 'Fine-Grained Access Control', description: 'Enable fine-grained access control', defaultValue: false },
      cognitoEnabled: { type: FIELD_TYPES.TOGGLE, name: 'cognitoEnabled', displayName: 'Cognito Authentication', description: 'Enable Cognito authentication', defaultValue: false }
    }
  },

  ecr: {
    name: 'ecr',
    displayName: 'Elastic Container Registry (ECR)',
    description: 'Managed Docker container registry',
    provider: 'aws',
    category: 'Storage',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable ECR', description: 'Enable ECR service', defaultValue: false },
      repositories: { type: FIELD_TYPES.ARRAY, name: 'repositories', displayName: 'Repositories', description: 'Container repositories', defaultValue: [] },
      lifecyclePolicy: { type: FIELD_TYPES.TOGGLE, name: 'lifecyclePolicy', displayName: 'Lifecycle Policy', description: 'Enable lifecycle policy for image cleanup', defaultValue: true },
      crossRegionReplication: { type: FIELD_TYPES.TOGGLE, name: 'crossRegionReplication', displayName: 'Cross-Region Replication', description: 'Enable cross-region replication', defaultValue: false },
      imageTagMutability: { type: FIELD_TYPES.DROPDOWN, name: 'imageTagMutability', displayName: 'Image Tag Mutability', description: 'Image tag mutability setting', defaultValue: 'MUTABLE', options: [{ value: 'MUTABLE', label: 'Mutable' }, { value: 'IMMUTABLE', label: 'Immutable' }] }
    }
  },

  s3: {
    name: 's3',
    displayName: 'Simple Storage Service (S3)',
    description: 'Scalable object storage service',
    provider: 'aws',
    category: 'Storage',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable S3', description: 'Enable S3 service', defaultValue: false },
      buckets: { type: FIELD_TYPES.ARRAY, name: 'buckets', displayName: 'Buckets', description: 'S3 buckets configuration', defaultValue: [] }
    }
  },

  lambda: {
    name: 'lambda',
    displayName: 'AWS Lambda',
    description: 'Serverless compute service',
    provider: 'aws',
    category: 'Compute',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Lambda', description: 'Enable Lambda service', defaultValue: false },
      functions: { type: FIELD_TYPES.ARRAY, name: 'functions', displayName: 'Functions', description: 'Lambda functions', defaultValue: [] },
      defaultRuntime: { type: FIELD_TYPES.DROPDOWN, name: 'defaultRuntime', displayName: 'Default Runtime', description: 'Default runtime for new functions', defaultValue: 'nodejs18.x', options: [{ value: 'nodejs18.x', label: 'Node.js 18.x' }, { value: 'python3.11', label: 'Python 3.11' }, { value: 'java17', label: 'Java 17' }, { value: 'dotnet6', label: '.NET 6' }, { value: 'go1.x', label: 'Go 1.x' }] },
      defaultMemory: { type: FIELD_TYPES.DROPDOWN, name: 'defaultMemory', displayName: 'Default Memory (MB)', description: 'Default memory allocation', defaultValue: 256, options: [{ value: 128, label: '128 MB' }, { value: 256, label: '256 MB' }, { value: 512, label: '512 MB' }, { value: 1024, label: '1024 MB' }, { value: 2048, label: '2048 MB' }, { value: 3008, label: '3008 MB' }] },
      defaultTimeout: { type: FIELD_TYPES.NUMBER, name: 'defaultTimeout', displayName: 'Default Timeout (seconds)', description: 'Default function timeout', defaultValue: 30, min: 1, max: 900 }
    }
  },

  elasticache: {
    name: 'elasticache',
    displayName: 'ElastiCache',
    description: 'In-memory caching service',
    provider: 'aws',
    category: 'Database',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable ElastiCache', description: 'Enable ElastiCache service', defaultValue: false },
      engine: { type: FIELD_TYPES.DROPDOWN, name: 'engine', displayName: 'Cache Engine', description: 'Cache engine type', defaultValue: 'redis', options: [{ value: 'redis', label: 'Redis' }, { value: 'memcached', label: 'Memcached' }] },
      version: { type: FIELD_TYPES.TEXT, name: 'version', displayName: 'Engine Version', description: 'Cache engine version', defaultValue: '7.0' },
      nodeType: { type: FIELD_TYPES.DROPDOWN, name: 'nodeType', displayName: 'Node Type', description: 'Cache node instance type', defaultValue: 'cache.t3.micro', options: [{ value: 'cache.t3.micro', label: 'cache.t3.micro' }, { value: 'cache.t3.small', label: 'cache.t3.small' }, { value: 'cache.t3.medium', label: 'cache.t3.medium' }, { value: 'cache.r6g.large', label: 'cache.r6g.large' }] },
      numCacheNodes: { type: FIELD_TYPES.NUMBER, name: 'numCacheNodes', displayName: 'Number of Nodes', description: 'Number of cache nodes', defaultValue: 1, min: 1, max: 20 },
      automaticFailover: { type: FIELD_TYPES.TOGGLE, name: 'automaticFailover', displayName: 'Automatic Failover', description: 'Enable automatic failover', defaultValue: false },
      multiAz: { type: FIELD_TYPES.TOGGLE, name: 'multiAz', displayName: 'Multi-AZ', description: 'Enable Multi-AZ deployment', defaultValue: false }
    }
  },

  sqs: {
    name: 'sqs',
    displayName: 'Simple Queue Service (SQS)',
    description: 'Managed message queuing service',
    provider: 'aws',
    category: 'Integration',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable SQS', description: 'Enable SQS service', defaultValue: false },
      queues: { type: FIELD_TYPES.ARRAY, name: 'queues', displayName: 'Queues', description: 'SQS queues configuration', defaultValue: [] },
      defaultVisibilityTimeout: { type: FIELD_TYPES.NUMBER, name: 'defaultVisibilityTimeout', displayName: 'Default Visibility Timeout (seconds)', description: 'Default message visibility timeout', defaultValue: 30, min: 0, max: 43200 },
      defaultMessageRetention: { type: FIELD_TYPES.NUMBER, name: 'defaultMessageRetention', displayName: 'Default Message Retention (seconds)', description: 'Default message retention period', defaultValue: 345600, min: 60, max: 1209600 }
    }
  },

  sns: {
    name: 'sns',
    displayName: 'Simple Notification Service (SNS)',
    description: 'Managed pub/sub messaging service',
    provider: 'aws',
    category: 'Integration',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable SNS', description: 'Enable SNS service', defaultValue: false },
      topics: { type: FIELD_TYPES.ARRAY, name: 'topics', displayName: 'Topics', description: 'SNS topics configuration', defaultValue: [] },
      defaultKmsKeyId: { type: FIELD_TYPES.TEXT, name: 'defaultKmsKeyId', displayName: 'Default KMS Key ID', description: 'Default KMS key for encryption', defaultValue: null }
    }
  },

  cloudfront: {
    name: 'cloudfront',
    displayName: 'CloudFront',
    description: 'Content delivery network (CDN)',
    provider: 'aws',
    category: 'Networking',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable CloudFront', description: 'Enable CloudFront service', defaultValue: false },
      distributions: { type: FIELD_TYPES.ARRAY, name: 'distributions', displayName: 'Distributions', description: 'CloudFront distributions', defaultValue: [] },
      priceClass: { type: FIELD_TYPES.DROPDOWN, name: 'priceClass', displayName: 'Price Class', description: 'CloudFront price class', defaultValue: 'PriceClass_100', options: [{ value: 'PriceClass_100', label: 'Use Only US, Canada and Europe' }, { value: 'PriceClass_200', label: 'Use US, Canada, Europe, Asia, Middle East and Africa' }, { value: 'PriceClass_All', label: 'Use All Edge Locations' }] },
      wafEnabled: { type: FIELD_TYPES.TOGGLE, name: 'wafEnabled', displayName: 'WAF Integration', description: 'Enable AWS WAF integration', defaultValue: false }
    }
  },

  route53: {
    name: 'route53',
    displayName: 'Route 53',
    description: 'Scalable DNS and domain name system',
    provider: 'aws',
    category: 'Networking',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Route 53', description: 'Enable Route 53 service', defaultValue: false },
      hostedZones: { type: FIELD_TYPES.ARRAY, name: 'hostedZones', displayName: 'Hosted Zones', description: 'DNS hosted zones', defaultValue: [] },
      recordSets: { type: FIELD_TYPES.ARRAY, name: 'recordSets', displayName: 'Record Sets', description: 'DNS record sets', defaultValue: [] }
    }
  },

  secretsManager: {
    name: 'secretsManager',
    displayName: 'Secrets Manager',
    description: 'Centralized secrets management',
    provider: 'aws',
    category: 'Security',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Secrets Manager', description: 'Enable Secrets Manager service', defaultValue: false },
      secrets: { type: FIELD_TYPES.ARRAY, name: 'secrets', displayName: 'Secrets', description: 'Managed secrets', defaultValue: [] },
      automaticRotation: { type: FIELD_TYPES.TOGGLE, name: 'automaticRotation', displayName: 'Automatic Rotation', description: 'Enable automatic secret rotation', defaultValue: false }
    }
  },

  iam: {
    name: 'iam',
    displayName: 'Identity and Access Management (IAM)',
    description: 'Access control and identity management',
    provider: 'aws',
    category: 'Security',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable IAM', description: 'Enable IAM service', defaultValue: false },
      roles: { type: FIELD_TYPES.ARRAY, name: 'roles', displayName: 'Roles', description: 'IAM roles configuration', defaultValue: [] },
      policies: { type: FIELD_TYPES.ARRAY, name: 'policies', displayName: 'Policies', description: 'IAM policies configuration', defaultValue: [] },
      assumeRolePolicyDocument: { type: FIELD_TYPES.TEXTAREA, name: 'assumeRolePolicyDocument', displayName: 'Assume Role Policy Document', description: 'JSON policy document for role assumption', defaultValue: null }
    }
  },

  // GCP Services
  gke: {
    name: 'gke',
    displayName: 'Google Kubernetes Engine (GKE)',
    description: 'Managed Kubernetes service from Google Cloud',
    provider: 'gcp',
    category: 'Compute',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable GKE', description: 'Enable GKE service', defaultValue: false },
      version: { type: FIELD_TYPES.DROPDOWN, name: 'version', displayName: 'Kubernetes Version', description: 'Kubernetes version', defaultValue: '1.28', options: [{ value: '1.26', label: '1.26' }, { value: '1.27', label: '1.27' }, { value: '1.28', label: '1.28' }, { value: '1.29', label: '1.29' }] },
      nodeCount: { type: FIELD_TYPES.NUMBER, name: 'nodeCount', displayName: 'Node Count', description: 'Number of nodes', defaultValue: 3, min: 1, max: 100 },
      machineType: { type: FIELD_TYPES.DROPDOWN, name: 'machineType', displayName: 'Machine Type', description: 'GCE machine type', defaultValue: 'e2-medium', options: [{ value: 'e2-micro', label: 'e2-micro' }, { value: 'e2-small', label: 'e2-small' }, { value: 'e2-medium', label: 'e2-medium' }, { value: 'e2-standard-2', label: 'e2-standard-2' }, { value: 'e2-standard-4', label: 'e2-standard-4' }] },
      diskSize: { type: FIELD_TYPES.NUMBER, name: 'diskSize', displayName: 'Disk Size (GB)', description: 'Boot disk size in GB', defaultValue: 50, min: 20, max: 1000 },
      enableAutoScaling: { type: FIELD_TYPES.TOGGLE, name: 'enableAutoScaling', displayName: 'Auto Scaling', description: 'Enable node auto scaling', defaultValue: true },
      enableAutopilot: { type: FIELD_TYPES.TOGGLE, name: 'enableAutopilot', displayName: 'Autopilot Mode', description: 'Enable GKE Autopilot', defaultValue: false }
    }
  },

  cloudSql: {
    name: 'cloudSql',
    displayName: 'Cloud SQL',
    description: 'Managed relational database service',
    provider: 'gcp',
    category: 'Database',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Cloud SQL', description: 'Enable Cloud SQL service', defaultValue: false },
      databaseVersion: { type: FIELD_TYPES.DROPDOWN, name: 'databaseVersion', displayName: 'Database Version', description: 'Database engine and version', defaultValue: 'POSTGRES_15', options: [{ value: 'POSTGRES_15', label: 'PostgreSQL 15' }, { value: 'POSTGRES_14', label: 'PostgreSQL 14' }, { value: 'MYSQL_8_0', label: 'MySQL 8.0' }, { value: 'MYSQL_5_7', label: 'MySQL 5.7' }] },
      tier: { type: FIELD_TYPES.DROPDOWN, name: 'tier', displayName: 'Machine Type', description: 'Instance tier', defaultValue: 'db-n1-standard-1', options: [{ value: 'db-f1-micro', label: 'db-f1-micro' }, { value: 'db-g1-small', label: 'db-g1-small' }, { value: 'db-n1-standard-1', label: 'db-n1-standard-1' }, { value: 'db-n1-standard-2', label: 'db-n1-standard-2' }] },
      diskSize: { type: FIELD_TYPES.NUMBER, name: 'diskSize', displayName: 'Disk Size (GB)', description: 'Storage size in GB', defaultValue: 10, min: 10, max: 1000 },
      enableBackup: { type: FIELD_TYPES.TOGGLE, name: 'enableBackup', displayName: 'Automated Backup', description: 'Enable automated backup', defaultValue: true },
      enableHighAvailability: { type: FIELD_TYPES.TOGGLE, name: 'enableHighAvailability', displayName: 'High Availability', description: 'Enable high availability', defaultValue: false }
    }
  },

  // OnPremise Services
  kubernetes: {
    name: 'kubernetes',
    displayName: 'Kubernetes Cluster',
    description: 'Self-managed Kubernetes cluster',
    provider: 'onpremise',
    category: 'Compute',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Kubernetes', description: 'Enable Kubernetes cluster', defaultValue: false },
      version: { type: FIELD_TYPES.DROPDOWN, name: 'version', displayName: 'Kubernetes Version', description: 'Kubernetes version', defaultValue: '1.28', options: [{ value: '1.26', label: '1.26' }, { value: '1.27', label: '1.27' }, { value: '1.28', label: '1.28' }, { value: '1.29', label: '1.29' }] },
      masterNodes: { type: FIELD_TYPES.NUMBER, name: 'masterNodes', displayName: 'Master Nodes', description: 'Number of master nodes', defaultValue: 3, min: 1, max: 10 },
      workerNodes: { type: FIELD_TYPES.NUMBER, name: 'workerNodes', displayName: 'Worker Nodes', description: 'Number of worker nodes', defaultValue: 3, min: 1, max: 100 },
      networkPlugin: { type: FIELD_TYPES.DROPDOWN, name: 'networkPlugin', displayName: 'Network Plugin', description: 'Container network interface', defaultValue: 'calico', options: [{ value: 'calico', label: 'Calico' }, { value: 'flannel', label: 'Flannel' }, { value: 'weave', label: 'Weave Net' }, { value: 'cilium', label: 'Cilium' }] }
    }
  },

  monitoring: {
    name: 'monitoring',
    displayName: 'Monitoring Stack',
    description: 'Prometheus and Grafana monitoring',
    provider: 'onpremise',
    category: 'Observability',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Monitoring', description: 'Enable monitoring stack', defaultValue: false },
      enablePrometheus: { type: FIELD_TYPES.TOGGLE, name: 'enablePrometheus', displayName: 'Prometheus', description: 'Enable Prometheus metrics collection', defaultValue: true },
      enableGrafana: { type: FIELD_TYPES.TOGGLE, name: 'enableGrafana', displayName: 'Grafana', description: 'Enable Grafana dashboards', defaultValue: true },
      enableAlertmanager: { type: FIELD_TYPES.TOGGLE, name: 'enableAlertmanager', displayName: 'Alertmanager', description: 'Enable alert management', defaultValue: true },
      retentionDays: { type: FIELD_TYPES.NUMBER, name: 'retentionDays', displayName: 'Retention (days)', description: 'Metrics retention period', defaultValue: 30, min: 1, max: 365 }
    }
  },

  logging: {
    name: 'logging',
    displayName: 'Logging Stack',
    description: 'Centralized logging with ELK stack',
    provider: 'onpremise',
    category: 'Observability',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Logging', description: 'Enable logging stack', defaultValue: false },
      enableElasticsearch: { type: FIELD_TYPES.TOGGLE, name: 'enableElasticsearch', displayName: 'Elasticsearch', description: 'Enable Elasticsearch', defaultValue: true },
      enableLogstash: { type: FIELD_TYPES.TOGGLE, name: 'enableLogstash', displayName: 'Logstash', description: 'Enable Logstash', defaultValue: true },
      enableKibana: { type: FIELD_TYPES.TOGGLE, name: 'enableKibana', displayName: 'Kibana', description: 'Enable Kibana dashboards', defaultValue: true },
      enableFluentd: { type: FIELD_TYPES.TOGGLE, name: 'enableFluentd', displayName: 'Fluentd', description: 'Enable Fluentd log collection', defaultValue: true }
    }
  },

  storage: {
    name: 'storage',
    displayName: 'Storage Solutions',
    description: 'Persistent storage configuration',
    provider: 'onpremise',
    category: 'Storage',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Storage', description: 'Enable storage solutions', defaultValue: false },
      enableNFS: { type: FIELD_TYPES.TOGGLE, name: 'enableNFS', displayName: 'NFS', description: 'Enable NFS storage', defaultValue: false },
      enableCeph: { type: FIELD_TYPES.TOGGLE, name: 'enableCeph', displayName: 'Ceph', description: 'Enable Ceph distributed storage', defaultValue: false },
      enableLonghorn: { type: FIELD_TYPES.TOGGLE, name: 'enableLonghorn', displayName: 'Longhorn', description: 'Enable Longhorn cloud-native storage', defaultValue: true },
      replicationFactor: { type: FIELD_TYPES.NUMBER, name: 'replicationFactor', displayName: 'Replication Factor', description: 'Storage replication factor', defaultValue: 3, min: 1, max: 5 }
    }
  },

  networking: {
    name: 'networking',
    displayName: 'Network Configuration',
    description: 'Network infrastructure setup',
    provider: 'onpremise',
    category: 'Networking',
    fields: {
      enabled: { type: FIELD_TYPES.TOGGLE, name: 'enabled', displayName: 'Enable Networking', description: 'Enable network configuration', defaultValue: false },
      enableLoadBalancer: { type: FIELD_TYPES.TOGGLE, name: 'enableLoadBalancer', displayName: 'Load Balancer', description: 'Enable load balancer (MetalLB)', defaultValue: true },
      enableIngress: { type: FIELD_TYPES.TOGGLE, name: 'enableIngress', displayName: 'Ingress Controller', description: 'Enable ingress controller', defaultValue: true },
      ingressType: { type: FIELD_TYPES.DROPDOWN, name: 'ingressType', displayName: 'Ingress Type', description: 'Ingress controller type', defaultValue: 'nginx', options: [{ value: 'nginx', label: 'NGINX' }, { value: 'traefik', label: 'Traefik' }, { value: 'haproxy', label: 'HAProxy' }] },
      enableSSL: { type: FIELD_TYPES.TOGGLE, name: 'enableSSL', displayName: 'SSL/TLS', description: 'Enable SSL/TLS certificates', defaultValue: true }
    }
  }
};

export const getServiceConfig = (serviceName) => {
  return SERVICES_CONFIG[serviceName];
};

export const getServicesByProvider = (providerType) => {
  return Object.values(SERVICES_CONFIG).filter(service => service.provider === providerType);
};

export const getServicesByCategory = (category) => {
  return Object.values(SERVICES_CONFIG).filter(service => service.category === category);
};

export const createDefaultServiceConfig = (serviceName) => {
  const config = getServiceConfig(serviceName);
  if (!config) return {};

  const defaultConfig = {};
  Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
    defaultConfig[fieldName] = fieldConfig.defaultValue;
  });

  return defaultConfig;
};
