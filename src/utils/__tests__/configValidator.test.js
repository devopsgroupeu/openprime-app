import {
  validateField,
  validateServiceConfig,
  validateEnvironmentConfig,
  getValidationSummary,
  ConfigValidationError,
} from "../configValidator";
import { FIELD_TYPES, SERVICES_CONFIG } from "../../config/servicesConfig";

describe("configValidator", () => {
  describe("validateField", () => {
    test("validates required text field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.TEXT,
        displayName: "Environment Name",
        required: true,
      };

      const errors = validateField(fieldConfig, "", "name");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigValidationError);
      expect(errors[0].message).toContain("required");
    });

    test("validates number field within range", () => {
      const fieldConfig = {
        type: FIELD_TYPES.NUMBER,
        displayName: "Min Nodes",
        min: 1,
        max: 10,
      };

      expect(validateField(fieldConfig, 5, "minNodes")).toHaveLength(0);
      expect(validateField(fieldConfig, 0, "minNodes")).toHaveLength(1);
      expect(validateField(fieldConfig, 15, "minNodes")).toHaveLength(1);
    });

    test("validates dropdown field options", () => {
      const fieldConfig = {
        type: FIELD_TYPES.DROPDOWN,
        displayName: "Instance Type",
        options: [
          { value: "t3.micro", label: "t3.micro" },
          { value: "t3.small", label: "t3.small" },
        ],
      };

      expect(validateField(fieldConfig, "t3.micro", "instanceType")).toHaveLength(0);
      expect(validateField(fieldConfig, "invalid", "instanceType")).toHaveLength(1);
    });

    test("validates pattern for text field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.TEXT,
        displayName: "CIDR Block",
        validation: { pattern: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ },
      };

      expect(validateField(fieldConfig, "10.0.0.0/16", "cidr")).toHaveLength(0);
      expect(validateField(fieldConfig, "invalid-cidr", "cidr")).toHaveLength(1);
    });

    test("validates toggle (boolean) field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.TOGGLE,
        displayName: "Enable Feature",
      };

      expect(validateField(fieldConfig, true, "enabled")).toHaveLength(0);
      expect(validateField(fieldConfig, false, "enabled")).toHaveLength(0);
      expect(validateField(fieldConfig, "true", "enabled")).toHaveLength(1);
    });

    test("validates multiselect field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.MULTISELECT,
        displayName: "Instance Types",
        options: [
          { value: "t3.micro", label: "t3.micro" },
          { value: "t3.small", label: "t3.small" },
        ],
      };

      expect(validateField(fieldConfig, ["t3.micro", "t3.small"], "instanceTypes")).toHaveLength(0);
      expect(validateField(fieldConfig, ["invalid"], "instanceTypes")).toHaveLength(1);
      expect(validateField(fieldConfig, "not-an-array", "instanceTypes")).toHaveLength(1);
    });

    test("validates array field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.ARRAY,
        displayName: "Buckets",
      };

      expect(validateField(fieldConfig, [], "buckets")).toHaveLength(0);
      expect(validateField(fieldConfig, ["bucket1", "bucket2"], "buckets")).toHaveLength(0);
      expect(validateField(fieldConfig, "not-an-array", "buckets")).toHaveLength(1);
    });

    test("validates object field", () => {
      const fieldConfig = {
        type: FIELD_TYPES.OBJECT,
        displayName: "Tags",
      };

      expect(validateField(fieldConfig, {}, "tags")).toHaveLength(0);
      expect(validateField(fieldConfig, { key: "value" }, "tags")).toHaveLength(0);
      expect(validateField(fieldConfig, [], "tags")).toHaveLength(1);
      expect(validateField(fieldConfig, null, "tags")).toHaveLength(0); // null is allowed when not required
    });
  });

  describe("validateServiceConfig - AWS Services", () => {
    test("validates VPC service config", () => {
      const vpcConfig = {
        enabled: true,
        cidr: "10.0.0.0/16",
        azCount: 2,
        createPublicSubnets: true,
        createPrivateSubnets: true,
        createIntraSubnets: false,
        createDatabaseSubnets: false,
        createDatabaseSubnetGroup: true,
        natGateway: "SINGLE",
        enableVpnGateway: false,
        enableFlowLogs: true,
        enableDnsHostnames: true,
        enableDnsSupport: true,
      };

      const errors = validateServiceConfig("vpc", vpcConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates VPC with invalid NAT Gateway option", () => {
      const vpcConfig = {
        enabled: true,
        cidr: "10.0.0.0/16",
        azCount: 2,
        natGateway: "invalid",
      };

      const errors = validateServiceConfig("vpc", vpcConfig);
      const natError = errors.find((e) => e.field === "natGateway");
      expect(natError).toBeDefined();
      expect(natError.message).toContain(
        "must be one of: NO_NAT, SINGLE, ONE_PER_SUBNET, ONE_PER_AZ",
      );
    });

    test("validates VPC with invalid CIDR format", () => {
      const vpcConfig = {
        enabled: true,
        cidr: "invalid-cidr",
        azCount: 2,
        natGateway: "SINGLE",
      };

      const errors = validateServiceConfig("vpc", vpcConfig);
      const cidrError = errors.find((e) => e.field === "cidr");
      expect(cidrError).toBeDefined();
    });

    test("validates EKS service config", () => {
      const eksConfig = {
        enabled: true,
        kubernetesVersion: "1.33",
        enableClusterCreatorAdminPermissions: true,
        endpointPublicAccess: true,
        authenticationMode: "API",
        enableIrsa: true,
        defaultNodeGroupAmiType: "BOTTLEROCKET_ARM_64",
        defaultNodeGroupInstanceTypes: ["t4g.large"],
        defaultNodeGroupCapacityType: "ON_DEMAND",
        defaultNodeGroupMinSize: 1,
        defaultNodeGroupMaxSize: 10,
        defaultNodeGroupDesiredSize: 2,
        defaultNodeGroupMaxUnavailable: 1,
      };

      const errors = validateServiceConfig("eks", eksConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates EKS node count constraints", () => {
      const eksConfig = {
        enabled: true,
        kubernetesVersion: "1.33",
        defaultNodeGroupMinSize: 5,
        defaultNodeGroupMaxSize: 2, // Invalid: min > max
      };

      const errors = validateServiceConfig("eks", eksConfig);
      const nodeCountError = errors.find((e) => e.field === "nodeCount");
      expect(nodeCountError).toBeDefined();
    });

    test("validates RDS service config", () => {
      const rdsConfig = {
        enabled: true,
        engine: "postgres",
        version: "15.4",
        instanceClass: "db.t3.small",
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        multiAz: false,
        backupRetention: 7,
        backupWindow: "03:00-06:00",
        maintenanceWindow: "Mon:00:00-Mon:03:00",
        encrypted: true,
        deletionProtection: false,
        skipFinalSnapshot: true,
        applyImmediately: false,
        autoMinorVersionUpgrade: true,
        publiclyAccessible: false,
      };

      const errors = validateServiceConfig("rds", rdsConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates Aurora service config", () => {
      const auroraConfig = {
        enabled: true,
        engine: "aurora-postgresql",
        engineVersion: "15.8",
        serverlessv2MinCapacity: 0.5,
        serverlessv2MaxCapacity: 10,
        backupRetention: 7,
        encrypted: true,
        deletionProtection: false,
        enableHttpEndpoint: true,
      };

      const errors = validateServiceConfig("aurora", auroraConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates OpenSearch service config", () => {
      const opensearchConfig = {
        enabled: true,
        domainName: "opensearch",
        version: "OpenSearch_2.19",
        instanceType: "m7g.medium.search",
        instanceCount: 3,
        dedicatedMasterEnabled: false,
        ebsEnabled: true,
        ebsVolumeSize: 64,
        ebsVolumeType: "gp3",
        encrypted: true,
        nodeToNodeEncryption: true,
        enforceHttps: true,
        tlsSecurityPolicy: "Policy-Min-TLS-1-2-2019-07",
        advancedSecurityEnabled: true,
        internalUserDatabaseEnabled: true,
        masterUserName: "admin",
      };

      const errors = validateServiceConfig("opensearch", opensearchConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates ECR service config", () => {
      const ecrConfig = {
        enabled: true,
        repositories: ["example-app"],
        repositoryType: "private",
        imageTagMutability: "IMMUTABLE",
        createLifecyclePolicy: true,
        enableScanning: true,
        scanType: "BASIC",
        enableReplication: false,
        repositoryEncryptionType: "AES256",
      };

      const errors = validateServiceConfig("ecr", ecrConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates S3 service config", () => {
      const s3Config = {
        enabled: true,
        buckets: [],
      };

      const errors = validateServiceConfig("s3", s3Config);
      expect(errors).toHaveLength(0);
    });

    test("validates Lambda service config", () => {
      const lambdaConfig = {
        enabled: true,
        functions: [],
        defaultRuntime: "nodejs18.x",
        defaultMemory: 256,
        defaultTimeout: 30,
      };

      const errors = validateServiceConfig("lambda", lambdaConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates ElastiCache service config", () => {
      const elasticacheConfig = {
        enabled: true,
        engine: "redis",
        version: "7.0",
        nodeType: "cache.t3.micro",
        numCacheNodes: 1,
        automaticFailover: false,
        multiAz: false,
      };

      const errors = validateServiceConfig("elasticache", elasticacheConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates MSK service config", () => {
      const mskConfig = {
        enabled: true,
        kafkaVersion: "3.5.1",
        numberOfBrokerNodes: 2,
        brokerNodeInstanceType: "kafka.t3.small",
      };

      const errors = validateServiceConfig("msk", mskConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates WAF service config", () => {
      const wafConfig = {
        enabled: true,
        name: "waf",
        description: "Default AWS WAF Managed rule set",
        scope: "REGIONAL",
        cloudwatchMetricsEnabled: true,
        metricName: "WAF-metrics",
        sampledRequestsEnabled: true,
      };

      const errors = validateServiceConfig("waf", wafConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates SQS service config", () => {
      const sqsConfig = {
        enabled: true,
        queues: [],
        defaultVisibilityTimeout: 30,
        defaultMessageRetention: 345600,
      };

      const errors = validateServiceConfig("sqs", sqsConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates SNS service config", () => {
      const snsConfig = {
        enabled: true,
        topics: [],
        defaultKmsKeyId: null,
      };

      const errors = validateServiceConfig("sns", snsConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates CloudFront service config", () => {
      const cloudfrontConfig = {
        enabled: true,
        distributions: [],
        priceClass: "PriceClass_100",
        wafEnabled: false,
      };

      const errors = validateServiceConfig("cloudfront", cloudfrontConfig);
      expect(errors).toHaveLength(0);
    });

    test("validates Route 53 service config", () => {
      const route53Config = {
        enabled: true,
        hostedZones: [],
        recordSets: [],
      };

      const errors = validateServiceConfig("route53", route53Config);
      expect(errors).toHaveLength(0);
    });
  });

  describe("validateServiceConfig - Invalid Configurations", () => {
    test("validates unknown service", () => {
      const errors = validateServiceConfig("unknown-service", {});
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("Unknown service");
    });

    test("validates invalid dropdown value", () => {
      const eksConfig = {
        enabled: true,
        kubernetesVersion: "invalid-version",
      };

      const errors = validateServiceConfig("eks", eksConfig);
      const versionError = errors.find((e) => e.field === "kubernetesVersion");
      expect(versionError).toBeDefined();
    });

    test("validates number out of range", () => {
      const eksConfig = {
        enabled: true,
        defaultNodeGroupMinSize: 150, // Max is 100
      };

      const errors = validateServiceConfig("eks", eksConfig);
      const minSizeError = errors.find((e) => e.field === "defaultNodeGroupMinSize");
      expect(minSizeError).toBeDefined();
    });

    test("validates invalid multiselect values", () => {
      const eksConfig = {
        enabled: true,
        defaultNodeGroupInstanceTypes: ["invalid-type"],
      };

      const errors = validateServiceConfig("eks", eksConfig);
      const instanceTypesError = errors.find((e) => e.field === "defaultNodeGroupInstanceTypes");
      expect(instanceTypesError).toBeDefined();
    });
  });

  describe("validateEnvironmentConfig", () => {
    test("validates complete environment config", () => {
      const environment = {
        name: "Test Environment",
        provider: "aws",
        region: "us-east-1",
        services: {
          vpc: {
            enabled: true,
            cidr: "10.0.0.0/16",
            azCount: 2,
            createPublicSubnets: true,
            createPrivateSubnets: true,
            natGateway: "SINGLE",
            enableVpnGateway: false,
            enableFlowLogs: true,
            enableDnsHostnames: true,
            enableDnsSupport: true,
          },
        },
      };

      const errors = validateEnvironmentConfig(environment);
      expect(errors).toHaveLength(0);
    });

    test("validates environment without name", () => {
      const environment = {
        provider: "aws",
        region: "us-east-1",
        services: {},
      };

      const errors = validateEnvironmentConfig(environment);
      const nameError = errors.find((e) => e.field === "name");
      expect(nameError).toBeDefined();
    });

    test("validates environment without provider", () => {
      const environment = {
        name: "Test",
        region: "us-east-1",
        services: {},
      };

      const errors = validateEnvironmentConfig(environment);
      const providerError = errors.find((e) => e.field === "provider");
      expect(providerError).toBeDefined();
    });

    test("validates environment without region", () => {
      const environment = {
        name: "Test",
        provider: "aws",
        services: {},
      };

      const errors = validateEnvironmentConfig(environment);
      const regionError = errors.find((e) => e.field === "region");
      expect(regionError).toBeDefined();
    });

    test("validates cross-service dependencies - EKS requires VPC", () => {
      const environment = {
        name: "Test Environment",
        provider: "aws",
        region: "us-east-1",
        services: {
          eks: { enabled: true, kubernetesVersion: "1.33" },
          // Missing VPC dependency
        },
      };

      const errors = validateEnvironmentConfig(environment);
      const eksError = errors.find((e) => e.field === "eks");
      expect(eksError).toBeDefined();
      expect(eksError.message).toContain("requires VPC");
    });

    test("validates cross-service dependencies - RDS requires VPC", () => {
      const environment = {
        name: "Test Environment",
        provider: "aws",
        region: "us-east-1",
        services: {
          rds: { enabled: true, engine: "postgres" },
          // Missing VPC dependency
        },
      };

      const errors = validateEnvironmentConfig(environment);
      const rdsError = errors.find((e) => e.field === "rds");
      expect(rdsError).toBeDefined();
      expect(rdsError.message).toContain("requires VPC");
    });

    test("validates environment with multiple services", () => {
      const environment = {
        name: "Production Environment",
        provider: "aws",
        region: "us-east-1",
        services: {
          vpc: {
            enabled: true,
            cidr: "10.0.0.0/16",
            azCount: 3,
            natGateway: "ONE_PER_AZ",
            enableFlowLogs: true,
          },
          eks: {
            enabled: true,
            kubernetesVersion: "1.33",
            defaultNodeGroupMinSize: 3,
            defaultNodeGroupMaxSize: 10,
            defaultNodeGroupDesiredSize: 5,
          },
          rds: {
            enabled: true,
            engine: "postgres",
            instanceClass: "db.r5.large",
            multiAz: true,
            encrypted: true,
          },
        },
      };

      const errors = validateEnvironmentConfig(environment);
      expect(errors).toHaveLength(0);
    });
  });

  describe("getValidationSummary", () => {
    test("returns validation summary", () => {
      const errors = [
        new ConfigValidationError("Name is required", "name"),
        new ConfigValidationError("Recommended setting", "setting"),
      ];

      const summary = getValidationSummary(errors);
      expect(summary.isValid).toBe(false);
      expect(summary.totalErrors).toBe(2);
      expect(summary.hasBlockingErrors).toBe(true);
    });

    test("returns valid summary for no errors", () => {
      const summary = getValidationSummary([]);
      expect(summary.isValid).toBe(true);
      expect(summary.totalErrors).toBe(0);
      expect(summary.hasBlockingErrors).toBe(false);
    });

    test("identifies critical errors", () => {
      const errors = [
        new ConfigValidationError("Invalid provider", "provider"),
        new ConfigValidationError("Invalid setting", "someSetting"),
      ];

      const summary = getValidationSummary(errors);
      expect(summary.criticalErrors).toHaveLength(1);
      expect(summary.criticalErrors[0].field).toBe("provider");
    });

    test("identifies warnings", () => {
      const errors = [
        new ConfigValidationError("This is recommended for production", "setting"),
        new ConfigValidationError("You should enable this feature", "feature"),
      ];

      const summary = getValidationSummary(errors);
      expect(summary.warnings).toHaveLength(2);
    });
  });

  describe("Service Configuration Completeness", () => {
    test("all services have required fields defined", () => {
      for (const [, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
        expect(serviceConfig).toHaveProperty("name");
        expect(serviceConfig).toHaveProperty("displayName");
        expect(serviceConfig).toHaveProperty("description");
        expect(serviceConfig).toHaveProperty("provider");
        expect(serviceConfig).toHaveProperty("category");
        expect(serviceConfig).toHaveProperty("fields");
        expect(typeof serviceConfig.fields).toBe("object");
      }
    });

    test("all service fields have valid types", () => {
      const validFieldTypes = Object.values(FIELD_TYPES);

      for (const [, serviceConfig] of Object.entries(SERVICES_CONFIG)) {
        for (const [, fieldConfig] of Object.entries(serviceConfig.fields)) {
          expect(validFieldTypes).toContain(fieldConfig.type);
        }
      }
    });
  });
});
