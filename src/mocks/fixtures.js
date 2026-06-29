// Canned data used by the MSW mock handlers (mock mode + tests).

export const currentUser = {
  id: "mock-user-1",
  username: "mockuser",
  email: "mock@openprime.dev",
  firstName: "Mock",
  lastName: "User",
  fullName: "Mock User",
  roles: ["user"],
  preferences: {
    theme: "dark",
    defaultProvider: "aws",
    defaultRegion: "eu-west-1",
  },
};

export const environments = [
  {
    id: "env-001",
    name: "demo-prod",
    global_prefix: "op-",
    provider: "aws",
    region: "eu-west-1",
    status: "running",
    services: {
      vpc: {
        enabled: true,
        cidrBlock: "10.0.0.0/16",
        region: "eu-west-1",
        enableDnsSupport: true,
        subnets: 3,
        availabilityZones: ["eu-west-1a", "eu-west-1b", "eu-west-1c"],
        natGateway: true,
      },
      eks: {
        enabled: true,
        version: "1.31",
        nodeGroups: 2,
        instanceType: "t3.large",
        nodeGroupMinSize: 2,
        nodeGroupMaxSize: 6,
        endpointPublicAccess: true,
        addons: ["vpc-cni", "coredns", "kube-proxy"],
        helmCharts: {
          "ingress-nginx": {
            enabled: true,
            version: "1.4.1",
            namespace: "ingress-system",
          },
          "kube-prometheus-stack": {
            enabled: true,
            version: "2.4.5",
            namespace: "monitoring",
          },
        },
      },
      rds: {
        enabled: true,
        engine: "postgres",
        engineVersion: "16.3",
        instanceType: "db.t3.medium",
        allocatedStorage: 100,
        port: 5432,
        backupRetentionDays: 7,
        multiAz: true,
        encryption: true,
      },
    },
    terraform_backend: {
      enabled: true,
      bucketName: "op-demo-tf-state",
      region: "eu-west-1",
      lockingMechanism: "DynamoDB",
      tableName: "op-demo-tf-locks",
    },
    git_repository: {
      enabled: true,
      url: "git@github.com:openprime/demo-infra.git",
      branch: "main",
      sshKey:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDEMOkeyForOpenPrimeDemoEnvironmentNotARealKey deploy@openprime",
    },
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-20T12:00:00Z",
  },
  {
    id: "env-002",
    name: "demo-staging",
    global_prefix: "op-",
    provider: "aws",
    region: "eu-west-3",
    status: "stopped",
    services: { vpc: { enabled: true }, eks: { enabled: true } },
    helmCharts: {},
    terraform_backend: { enabled: false },
    git_repository: null,
    created_at: "2026-06-05T09:00:00Z",
    updated_at: "2026-06-18T08:30:00Z",
  },
];

export const credentials = [
  {
    id: "cred-001",
    name: "aws-sandbox",
    provider: "aws",
    identifier: "AKIA****MOCK",
    created_at: "2026-05-01T00:00:00Z",
  },
];
