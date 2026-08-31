import { describe, it, expect } from "vitest";
import { backfillServices } from "../environmentsConfig";
import { getProviderServices } from "../providersConfig";

describe("backfillServices", () => {
  it("adds services the stored environment predates", () => {
    const stored = { provider: "aws", services: { vpc: { enabled: true } } };
    const { services } = backfillServices(stored);

    for (const name of getProviderServices("aws")) {
      expect(services[name]).toBeDefined();
    }
  });

  it("leaves an existing service exactly as it was stored", () => {
    const vpc = { enabled: true, cidr: "10.9.0.0/16" };
    const { services } = backfillServices({
      provider: "aws",
      services: { vpc },
    });

    expect(services.vpc).toBe(vpc);
  });

  // A service the catalog stopped describing must not be deleted from a stored
  // environment: the grid stops offering it, but the config is the user's.
  it("keeps a service the catalog no longer describes", () => {
    const { services } = backfillServices({
      provider: "aws",
      services: { retiredService: { enabled: true } },
    });

    expect(services.retiredService).toEqual({ enabled: true });
  });

  it("gives a Kubernetes service its default helm charts", () => {
    const { services } = backfillServices({ provider: "aws", services: {} });

    expect(services.eks.helmCharts).toBeDefined();
  });

  it("does not mutate the environment it was given", () => {
    const stored = { provider: "aws", services: {} };
    backfillServices(stored);

    expect(stored.services).toEqual({});
  });
});
