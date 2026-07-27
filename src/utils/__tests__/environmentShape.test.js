import { normalizeEnvironment } from "../environmentShape";

describe("normalizeEnvironment", () => {
  it("maps the API's snake_case fields onto the camelCase names the wizard reads", () => {
    const normalized = normalizeEnvironment({
      id: "env-001",
      name: "demo-prod",
      global_prefix: "op-",
      terraform_backend: { enabled: true, bucketName: "b" },
      git_repository: { enabled: true, url: "git@example.com:acme/infra.git" },
      cloud_credential_id: "cred-1",
      state_key: "env/env-001",
    });

    expect(normalized).toMatchObject({
      id: "env-001",
      name: "demo-prod",
      globalPrefix: "op-",
      terraformBackend: { enabled: true, bucketName: "b" },
      gitRepository: { enabled: true, url: "git@example.com:acme/infra.git" },
      cloudCredentialId: "cred-1",
      stateKey: "env/env-001",
    });
    // The snake_case aliases are consumed, not carried alongside.
    expect(normalized).not.toHaveProperty("global_prefix");
    expect(normalized).not.toHaveProperty("terraform_backend");
  });

  it("prefers an explicit camelCase value over its snake_case alias", () => {
    const normalized = normalizeEnvironment({
      globalPrefix: "camel-",
      global_prefix: "snake-",
    });

    expect(normalized.globalPrefix).toBe("camel-");
  });

  it("drops chart keys the catalog no longer knows, so counters match what generation emits", () => {
    const normalized = normalizeEnvironment({
      services: {
        eks: {
          enabled: true,
          helmCharts: {
            ingressNginx: { enabled: true },
            thanos: { enabled: true },
            "ingress-nginx": { enabled: true },
          },
        },
      },
    });

    expect(Object.keys(normalized.services.eks.helmCharts)).toEqual([
      "ingressNginx",
    ]);
    expect(normalized.services.eks.enabled).toBe(true);
  });

  it("leaves services without charts and non-object input untouched", () => {
    expect(
      normalizeEnvironment({ services: { rds: { enabled: true } } }).services
        .rds,
    ).toEqual({ enabled: true });
    expect(normalizeEnvironment(null)).toBeNull();
  });
});
