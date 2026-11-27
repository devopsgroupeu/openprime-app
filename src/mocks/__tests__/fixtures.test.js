import { describe, expect, it } from "vitest";
import catalog from "../catalog.json";
import { environments } from "../fixtures";
import { getProviderRegions } from "../../config/providersConfig";

// Mock mode is what people click through first: its environments must read
// like ones the wizard saved, in keys and values the catalog offers. The one
// exception is a value the catalog dropped, kept on analytics-dev on purpose
// to show the wizard's "no longer offered" warning.
const LEGACY = [["env-003", "opensearch", "version"]];

const problems = (env) =>
  Object.entries(env.services).flatMap(([service, config]) =>
    Object.entries(config)
      .filter(([key]) => key !== "enabled" && key !== "helmCharts")
      .flatMap(([key, value]) => {
        const field = catalog.services[service]?.fields[key];
        if (!field) return [`${service}.${key} is not a catalog parameter`];
        const offered = field.options?.map((o) => String(o.value));
        const values = Array.isArray(value) ? value : [value];
        const legacy = LEGACY.some(
          ([id, s, k]) => id === env.id && s === service && k === key,
        );
        return offered && !legacy
          ? values
              .filter((v) => !offered.includes(String(v)))
              .map((v) => `${service}.${key} = ${v} is not offered`)
          : [];
      }),
  );

describe("mock environments", () => {
  it.each(environments.map((env) => [env.name, env]))(
    "%s uses catalog parameters and offered values",
    (_, env) => {
      expect(problems(env)).toEqual([]);
    },
  );

  it.each(environments.map((env) => [env.name, env]))(
    "%s is in a listed region",
    (_, env) => {
      const regions = getProviderRegions("aws").map((r) => r.value);
      expect(regions).toContain(env.region);
    },
  );

  it("keeps the legacy value on analytics-dev only", () => {
    const [[id, service, key]] = LEGACY;
    const env = environments.find((e) => e.id === id);
    const offered = catalog.services[service].fields[key].options.map(
      (o) => o.value,
    );
    expect(env.name).toBe("analytics-dev");
    expect(offered).not.toContain(env.services[service][key]);
  });
});
