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
      vpc: { enabled: true },
      eks: { enabled: true },
      rds: { enabled: true },
    },
    helmCharts: {
      "kube-prometheus-stack": { enabled: true },
      "ingress-nginx": { enabled: true },
    },
    terraform_backend: { enabled: true, bucket: "op-demo-tf-state" },
    git_repository: {
      url: "git@github.com:example/demo-infra.git",
      branch: "main",
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
