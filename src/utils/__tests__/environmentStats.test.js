import {
  byProvider,
  enabledServices,
  generations,
  providerFilters,
  providerOf,
  regionsInUse,
  servicesInUse,
  shortServiceName,
  statusBreakdown,
  filterAndSortEnvironments,
  getEffectiveStatus,
  lastJob,
  statusDisplay,
  statusFilters,
  regionName,
  summarizeEnvironments,
} from "../environmentStats";

const prod = {
  id: "env-1",
  name: "demo-prod",
  global_prefix: "op-",
  region: "eu-west-1",
  status: "running",
  services: {
    vpc: { enabled: true },
    eks: { enabled: true },
    rds: { enabled: true },
  },
  updated_at: "2026-06-20T12:00:00Z",
};

const staging = {
  id: "env-2",
  name: "demo-staging",
  global_prefix: "stg-",
  region: "eu-west-3",
  status: "stopped",
  services: {
    vpc: { enabled: true },
    s3: { enabled: true },
    rds: { enabled: false },
  },
  updated_at: "2026-06-22T08:30:00Z",
};

describe("summarizeEnvironments", () => {
  it("counts environments, enabled services and regions", () => {
    expect(summarizeEnvironments([prod, staging])).toEqual({
      total: 2,
      services: 5,
      regions: 2,
      lastGenerated: null,
    });
  });

  it("counts a region per provider, as the region map does", () => {
    const twin = {
      ...staging,
      id: "env-9",
      provider: "gcp",
      region: "eu-west-3",
    };
    expect(summarizeEnvironments([staging, twin]).regions).toBe(2);
  });

  it("returns zeros for no environments", () => {
    expect(summarizeEnvironments([])).toEqual({
      total: 0,
      services: 0,
      regions: 0,
      lastGenerated: null,
    });
  });

  // The Ready count left the strip (the filter tabs show it); the strip
  // dates the last successful generate instead.
  it("dates the last successful generate across the environments", () => {
    const generated = (env, at, status = "succeeded") => ({
      ...env,
      last_generate_at: at,
      last_generate_status: status,
    });
    expect(
      summarizeEnvironments([
        generated(prod, "2026-07-01T10:00:00Z"),
        generated(staging, "2026-08-01T10:00:00Z"),
        generated(staging, "2026-09-01T10:00:00Z", "failed"),
      ]).lastGenerated,
    ).toBe("2026-08-01T10:00:00Z");
  });

  it("counts a region once however many environments use it", () => {
    expect(
      summarizeEnvironments([prod, { ...staging, region: "eu-west-1" }])
        .regions,
    ).toBe(1);
  });
});

describe("regionName", () => {
  it("names a listed region and nothing else", () => {
    expect(regionName({ provider: "aws", region: "eu-west-1" })).toBe(
      "Europe (Ireland)",
    );
    expect(regionName({ provider: "aws", location: "us-east-1" })).toBe(
      "US East (N. Virginia)",
    );
    expect(
      regionName({ provider: "aws", region: "eu-west-3" }),
    ).toBeUndefined();
  });
});

describe("enabledServices", () => {
  it("lists only enabled service keys", () => {
    expect(enabledServices(staging)).toEqual(["vpc", "s3"]);
    expect(enabledServices({})).toEqual([]);
  });
});

describe("getEffectiveStatus", () => {
  it("prefers the most recent job outcome over the lifecycle status", () => {
    expect(
      getEffectiveStatus({
        status: "running",
        last_generate_at: "2026-07-01T10:00:00Z",
        last_generate_status: "succeeded",
        last_push_at: "2026-07-02T10:00:00Z",
        last_push_status: "failed",
      }),
    ).toBe("failed");
    expect(getEffectiveStatus({})).toBe("pending");
  });

  // The backend writes `deploying` when a worker claims a job, before the
  // outcome lands in last_*: a regeneration in flight reads Processing.
  it("reads a job in flight as deploying even after earlier jobs", () => {
    const inFlight = {
      status: "deploying",
      last_generate_at: "2026-07-01T10:00:00Z",
      last_generate_status: "succeeded",
    };
    expect(getEffectiveStatus(inFlight)).toBe("deploying");
    expect(statusDisplay(getEffectiveStatus(inFlight)).key).toBe("processing");
  });
});

describe("lastJob", () => {
  it("returns the most recent job with its error, or null before any", () => {
    expect(
      lastJob({
        last_generate_at: "2026-07-01T10:00:00Z",
        last_generate_status: "succeeded",
        last_push_at: "2026-07-02T10:00:00Z",
        last_push_status: "failed",
        last_push_error: "Failed to push to Git: permission denied",
      }),
    ).toEqual({
      kind: "push",
      status: "failed",
      error: "Failed to push to Git: permission denied",
    });
    expect(
      lastJob({
        last_generate_at: "2026-07-01T10:00:00Z",
        last_generate_status: "failed",
        last_generate_error: "Terraform fmt failed",
      }),
    ).toEqual({
      kind: "generate",
      status: "failed",
      error: "Terraform fmt failed",
    });
    expect(lastJob({ status: "pending" })).toBeNull();
  });
});

describe("statusDisplay", () => {
  it("reads job outcomes as Ready or Failed and no job as Not generated", () => {
    expect(statusDisplay("succeeded")).toMatchObject({
      key: "ready",
      label: "Ready",
    });
    expect(statusDisplay("failed")).toMatchObject({
      key: "failed",
      label: "Failed",
    });
    expect(statusDisplay("pending")).toMatchObject({
      key: "not-generated",
      label: "Not generated",
    });
  });

  it("keeps legacy and unknown statuses readable", () => {
    expect(statusDisplay("running").key).toBe("ready");
    expect(statusDisplay("deploying").label).toBe("Processing");
    expect(statusDisplay("stopped").label).toBe("Stopped");
    expect(statusDisplay("destroyed").label).toBe("Destroyed");
    expect(statusDisplay("archived")).toMatchObject({
      key: "archived",
      label: "Archived",
    });
    expect(statusDisplay(undefined).label).toBe("Unknown");
  });
});

describe("statusFilters", () => {
  it("lists only occurring statuses, Ready, Not generated, Failed first", () => {
    const pending = { ...staging, status: "pending" };
    const failed = {
      ...prod,
      last_generate_at: "2026-07-01T10:00:00Z",
      last_generate_status: "failed",
    };
    const generated = {
      ...pending,
      last_generate_at: "2026-07-01T10:00:00Z",
      last_generate_status: "succeeded",
    };
    expect(
      statusFilters([staging, failed, pending, generated, prod, pending]),
    ).toEqual([
      { value: "ready", label: "Ready", count: 2 },
      { value: "not-generated", label: "Not generated", count: 2 },
      { value: "failed", label: "Failed", count: 1 },
      { value: "stopped", label: "Stopped", count: 1 },
    ]);
    expect(statusFilters([])).toEqual([]);
  });
});

describe("filterAndSortEnvironments", () => {
  const sandbox = {
    id: "env-3",
    name: "Sandbox",
    globalPrefix: "sbx-",
    region: "us-east-1",
    status: "stopped",
    services: { vpc: { enabled: true } },
    created_at: "2026-05-01T00:00:00Z",
  };
  const all = [prod, staging, sandbox];
  const names = (envs) => envs.map((e) => e.name);
  const run = (options) =>
    names(
      filterAndSortEnvironments(all, {
        query: "",
        status: "all",
        sort: "modified",
        ...options,
      }),
    );

  it("sorts by the most recent modification by default", () => {
    expect(run({})).toEqual(["demo-staging", "demo-prod", "Sandbox"]);
  });

  it("sorts by name A to Z", () => {
    expect(run({ sort: "name" })).toEqual([
      "demo-prod",
      "demo-staging",
      "Sandbox",
    ]);
  });

  it("sorts by most enabled services, then by name", () => {
    expect(run({ sort: "services" })).toEqual([
      "demo-prod",
      "demo-staging",
      "Sandbox",
    ]);
    expect(
      names(
        filterAndSortEnvironments([staging, { ...prod, name: "a-prod" }], {
          query: "",
          status: "all",
          sort: "services",
        }),
      ),
    ).toEqual(["a-prod", "demo-staging"]);
  });

  it("searches name, prefix and region, ignoring case", () => {
    expect(run({ query: "STAGING" })).toEqual(["demo-staging"]);
    expect(run({ query: "sbx" })).toEqual(["Sandbox"]);
    expect(run({ query: "eu-west" })).toEqual(["demo-staging", "demo-prod"]);
    expect(run({ query: "  op-  " })).toEqual(["demo-prod"]);
    expect(run({ query: "nothing" })).toEqual([]);
  });

  it("filters by status key and combines with search", () => {
    expect(run({ status: "stopped" })).toEqual(["demo-staging", "Sandbox"]);
    expect(run({ status: "ready" })).toEqual(["demo-prod"]);
    expect(run({ status: "stopped", query: "demo" })).toEqual(["demo-staging"]);
    expect(run({ status: "failed" })).toEqual([]);
  });

  it("does not reorder the list it was given", () => {
    const input = [sandbox, prod];
    filterAndSortEnvironments(input, {
      query: "",
      status: "all",
      sort: "name",
    });
    expect(names(input)).toEqual(["Sandbox", "demo-prod"]);
  });
});

describe("statusBreakdown", () => {
  it("counts each status with its tone, in the filter-tab order", () => {
    const failed = { ...prod, id: "env-3", status: "failed" };
    const pending = { ...prod, id: "env-4", status: "pending" };
    expect(statusBreakdown([failed, prod, pending, prod])).toEqual([
      { key: "ready", label: "Ready", tone: "success", count: 2 },
      {
        key: "not-generated",
        label: "Not generated",
        tone: "neutral",
        count: 1,
      },
      { key: "failed", label: "Failed", tone: "destructive", count: 1 },
    ]);
  });
});

describe("servicesInUse", () => {
  it("counts the environments per enabled service, most first, then by name", () => {
    const aws = { provider: "aws", of: 2 };
    expect(servicesInUse([prod, staging])).toEqual([
      {
        key: "vpc",
        name: "VPC",
        title: "Virtual Private Cloud (VPC)",
        count: 2,
        ...aws,
      },
      {
        key: "eks",
        name: "EKS",
        title: "Elastic Kubernetes Service (EKS)",
        count: 1,
        ...aws,
      },
      {
        key: "rds",
        name: "RDS",
        title: "Relational Database Service (RDS)",
        count: 1,
        ...aws,
      },
      {
        key: "s3",
        name: "S3",
        title: "Simple Storage Service (S3)",
        count: 1,
        ...aws,
      },
    ]);
  });

  it("groups the services by provider and counts each against its provider's environments", () => {
    const azure = {
      ...staging,
      id: "env-7",
      provider: "azure",
      services: { aks: { enabled: true }, vnet: { enabled: true } },
    };
    const gcp = {
      ...staging,
      id: "env-8",
      provider: "gcp",
      services: { gke: { enabled: true } },
    };
    expect(
      servicesInUse([gcp, azure, prod, staging]).map(
        ({ provider, key, count, of }) => [provider, key, count, of],
      ),
    ).toEqual([
      ["aws", "vpc", 2, 2],
      ["aws", "eks", 1, 2],
      ["aws", "rds", 1, 2],
      ["aws", "s3", 1, 2],
      ["azure", "aks", 1, 1],
      ["azure", "vnet", 1, 1],
      ["gcp", "gke", 1, 1],
    ]);
  });

  it("names a service the catalog does not know by its key", () => {
    const env = { ...prod, services: { pulsar: { enabled: true } } };
    expect(servicesInUse([env])).toEqual([
      {
        key: "pulsar",
        name: "PULSAR",
        title: "PULSAR",
        count: 1,
        provider: "aws",
        of: 1,
      },
    ]);
  });

  it("is empty without enabled services", () => {
    expect(servicesInUse([])).toEqual([]);
  });
});

describe("providers", () => {
  const azure = { ...staging, id: "env-7", provider: "azure" };
  const onprem = { ...staging, id: "env-9", provider: "onpremise" };

  it("reads an environment without a provider as AWS", () => {
    expect(providerOf(prod)).toBe("aws");
    expect(providerOf(azure)).toBe("azure");
  });

  it("offers a tab per provider that occurs, in the catalog order", () => {
    expect(providerFilters([onprem, azure, prod, staging])).toEqual([
      { value: "aws", label: "AWS", count: 2 },
      { value: "azure", label: "Azure", count: 1 },
      { value: "onpremise", label: "On-prem", count: 1 },
    ]);
  });

  it("keeps the environments of one provider, or all", () => {
    expect(byProvider([prod, azure, staging], "azure")).toEqual([azure]);
    expect(byProvider([prod, azure], "all")).toEqual([prod, azure]);
  });
});

describe("shortServiceName", () => {
  it.each([
    ["Virtual Private Cloud (VPC)", "VPC"],
    ["Managed Streaming for Apache Kafka (MSK)", "MSK"],
    ["OpenSearch Service", "OpenSearch"],
    ["AWS Lambda", "Lambda"],
    ["Aurora Serverless", "Aurora Serverless"],
    ["Route 53", "Route 53"],
  ])("reads %s as %s", (full, short) => {
    expect(shortServiceName(full)).toBe(short);
  });
});

describe("regionsInUse", () => {
  it("names each region by its city, most environments first", () => {
    expect(
      regionsInUse([
        prod,
        { ...staging, region: "eu-west-1" },
        { ...staging, id: "env-5", region: "us-east-1" },
        { ...staging, id: "env-6", region: "xx-test-9" },
      ]),
    ).toEqual([
      {
        region: "eu-west-1",
        provider: "aws",
        name: "Europe (Ireland)",
        city: "Ireland",
        at: [-6.26, 53.35],
        count: 2,
      },
      {
        region: "us-east-1",
        provider: "aws",
        name: "US East (N. Virginia)",
        city: "N. Virginia",
        at: [-77.49, 39.04],
        count: 1,
      },
      {
        region: "xx-test-9",
        provider: "aws",
        name: "xx-test-9",
        city: "xx-test-9",
        at: null,
        count: 1,
      },
    ]);
  });
});

describe("regionsInUse across providers", () => {
  it("tells the providers' regions apart and places a listed cloud region", () => {
    const gcp = {
      ...staging,
      id: "env-8",
      provider: "gcp",
      region: "europe-west3",
    };
    const onprem = {
      ...staging,
      id: "env-9",
      provider: "onpremise",
      region: "datacenter-1",
    };
    expect(
      regionsInUse([gcp, onprem]).map(({ provider, region, city, at }) => [
        provider,
        region,
        city,
        at,
      ]),
    ).toEqual([
      ["onpremise", "datacenter-1", "datacenter-1", null],
      ["gcp", "europe-west3", "Frankfurt", [8.68, 50.11]],
    ]);
  });
});

describe("generations", () => {
  it("lists each environment's last generate, oldest first", () => {
    expect(
      generations([
        {
          ...prod,
          last_generate_at: "2026-08-01T10:00:00Z",
          last_generate_status: "failed",
        },
        staging,
        {
          ...staging,
          last_generate_at: "2026-07-01T10:00:00Z",
          last_generate_status: "succeeded",
        },
      ]),
    ).toEqual([
      {
        id: "env-2",
        name: "demo-staging",
        at: "2026-07-01T10:00:00Z",
        status: "succeeded",
      },
      {
        id: "env-1",
        name: "demo-prod",
        at: "2026-08-01T10:00:00Z",
        status: "failed",
      },
    ]);
  });
});
