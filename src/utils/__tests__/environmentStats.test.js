import {
  enabledServices,
  filterAndSortEnvironments,
  getEffectiveStatus,
  statusDisplay,
  statusFilters,
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
  it("counts environments, ready ones, enabled services and regions", () => {
    expect(summarizeEnvironments([prod, staging])).toEqual({
      total: 2,
      ready: 1,
      services: 5,
      regions: 2,
    });
  });

  it("returns zeros for no environments", () => {
    expect(summarizeEnvironments([])).toEqual({
      total: 0,
      ready: 0,
      services: 0,
      regions: 0,
    });
  });

  it("counts ready by the effective status the badge shows", () => {
    const generated = {
      ...staging,
      status: "pending",
      last_generate_at: "2026-07-01T10:00:00Z",
      last_generate_status: "succeeded",
    };
    const broken = {
      ...prod,
      last_push_at: "2026-07-01T10:00:00Z",
      last_push_status: "failed",
    };
    expect(summarizeEnvironments([generated]).ready).toBe(1);
    expect(summarizeEnvironments([broken]).ready).toBe(0);
    expect(
      summarizeEnvironments([{ ...staging, status: "pending" }]).ready,
    ).toBe(0);
  });

  it("counts a region once however many environments use it", () => {
    expect(
      summarizeEnvironments([prod, { ...staging, region: "eu-west-1" }])
        .regions,
    ).toBe(1);
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
