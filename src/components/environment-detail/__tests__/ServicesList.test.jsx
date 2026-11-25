import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { getServiceConfig } from "../../../config/servicesConfig";
import ServicesList, { summaryOf } from "../ServicesList";

// setupTests hydrates the registry from the catalog, so the definitions are
// the catalog's (keys, option labels, display names).
const summary = (name, config) =>
  summaryOf(name, { enabled: true, ...config }, getServiceConfig(name));

describe("summaryOf", () => {
  it("names the key parameters, with option labels and units", () => {
    expect(
      summary("rds", {
        engine: "postgres",
        version: "16",
        instanceClass: "db.t3.medium",
        allocatedStorage: 100,
        multiAz: true,
      }),
    ).toBe("PostgreSQL, t3.medium, 100 GB");
    expect(
      summary("opensearch", {
        version: "OpenSearch_2.19",
        instanceType: "m7g.medium.search",
        instanceCount: 2,
      }),
    ).toBe("OpenSearch 2.19, m7g.medium.search, 2 instances");
    expect(summary("elasticache", { engine: "valkey", numCacheNodes: 1 })).toBe(
      "Valkey, 1 cache node",
    );
  });

  it("skips switches and keeps versions short", () => {
    expect(
      summary("vpc", {
        cidr: "10.0.0.0/16",
        azCount: 3,
        natGateway: "ONE_PER_AZ",
        enableDnsSupport: true,
      }),
    ).toBe("10.0.0.0/16, 3 AZs");
    expect(
      summary("eks", {
        karpenterEnabled: true,
        kubernetesVersion: "1.36",
        defaultNodeGroupInstanceTypes: ["t4g.large"],
        defaultNodeGroupDesiredSize: 2,
      }),
    ).toBe("v1.36, t4g.large, 2 desired nodes");
  });

  it("falls back to the first three set parameters, never a switch", () => {
    expect(
      summary("sqs", {
        queueNames: ["orders"],
        fifoQueues: true,
        contentBasedDeduplication: false,
        visibilityTimeout: 30,
        messageRetention: 345600,
        delaySeconds: 0,
      }),
    ).toBe("orders, 30 seconds, 345600 seconds");
    expect(summary("sqs", { fifoQueues: true })).toBe("");
  });
});

describe("ServicesList", () => {
  it("reads switches in a service's details as Yes or No", () => {
    render(
      <MemoryRouter>
        <ServicesList
          environment={{
            services: {
              eks: {
                enabled: true,
                kubernetesVersion: "1.36",
                endpointPublicAccess: true,
                enableIrsa: false,
              },
            },
          }}
          editHref="/environments/env-1/edit"
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Kubernetes/ }));

    const term = (label) =>
      within(screen.getByText(label).parentElement).getByRole("definition");
    expect(term("Public Endpoint")).toHaveTextContent("Yes");
    expect(term("IRSA")).toHaveTextContent("No");
  });
});
