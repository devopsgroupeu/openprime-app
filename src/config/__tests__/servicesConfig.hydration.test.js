import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SERVICES_CONFIG,
  hydrateServicesConfig,
  getServiceConfig,
  createDefaultServiceConfig,
} from "../servicesConfig";
import { FIELD_TYPES } from "../services/fieldTypes";

const doc = (services, extra = {}) => ({
  schemaVersion: 1,
  provider: "aws",
  services,
  ...extra,
});

const field = (over = {}) => ({
  name: "size",
  displayName: "Size",
  type: FIELD_TYPES.TEXT,
  valueType: "string",
  defaultValue: "m5.large",
  ...over,
});

describe("hydrateServicesConfig", () => {
  let warn;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("hydrates in place so existing consumers keep their reference", () => {
    const before = SERVICES_CONFIG;
    hydrateServicesConfig(
      doc({ eks: { displayName: "EKS", fields: { size: field() } } }),
    );

    // Same object, not a replacement — this is what lets the ~5 importers stay
    // synchronous with no signature change.
    expect(SERVICES_CONFIG).toBe(before);
    expect(getServiceConfig("eks").displayName).toBe("EKS");
  });

  it("fills in what the catalog does not carry but the wizard reads", () => {
    hydrateServicesConfig(
      doc({ rds: { displayName: "RDS", fields: { size: field() } } }),
    );
    const svc = getServiceConfig("rds");

    expect(svc.name).toBe("rds");
    expect(svc.provider).toBe("aws");
  });

  it("keeps the static seed for providers no catalog describes", () => {
    hydrateServicesConfig(
      doc({ eks: { displayName: "EKS", fields: { size: field() } } }),
    );

    // azure/gcp/onprem have no template directories, so nothing can extract them.
    const providers = new Set(
      Object.values(SERVICES_CONFIG).map((s) => s.provider),
    );
    expect(providers.has("azure")).toBe(true);
  });

  it("drops services a later catalog no longer has", () => {
    hydrateServicesConfig(
      doc({ eks: { displayName: "EKS", fields: { size: field() } } }),
    );
    expect(getServiceConfig("eks")).toBeDefined();

    hydrateServicesConfig(
      doc({ rds: { displayName: "RDS", fields: { size: field() } } }),
    );
    expect(getServiceConfig("eks")).toBeUndefined();
    expect(getServiceConfig("rds")).toBeDefined();
  });

  // FIELD_TYPES has no DYNAMIC_LIST, so `case FIELD_TYPES.DYNAMIC_LIST` in the
  // renderer is `case undefined`: a field with no control lands there and dies
  // on fieldConfig.itemSchema. Rendering the wrong control beats taking the
  // service card down, so it degrades to text and says so.
  it("falls back to a text control rather than letting the card crash", () => {
    hydrateServicesConfig(
      doc({
        eks: {
          displayName: "EKS",
          fields: { size: field({ type: undefined }) },
        },
      }),
    );

    expect(getServiceConfig("eks").fields.size.type).toBe(FIELD_TYPES.TEXT);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("eks.size"));
  });

  it("falls back for a control this build has never heard of", () => {
    hydrateServicesConfig(
      doc({
        eks: {
          displayName: "EKS",
          fields: { size: field({ type: "slider" }) },
        },
      }),
    );

    expect(getServiceConfig("eks").fields.size.type).toBe(FIELD_TYPES.TEXT);
  });

  it("compiles a validation pattern so consumers can call .test()", () => {
    hydrateServicesConfig(
      doc({
        vpc: {
          displayName: "VPC",
          fields: { cidr: field({ validation: { pattern: "^10\\." } }) },
        },
      }),
    );

    const { pattern } = getServiceConfig("vpc").fields.cidr.validation;
    expect(pattern).toBeInstanceOf(RegExp);
    expect(pattern.test("10.0.0.0/16")).toBe(true);
  });

  it("drops only the broken pattern, not the field", () => {
    hydrateServicesConfig(
      doc({
        vpc: {
          displayName: "VPC",
          fields: { cidr: field({ validation: { pattern: "([unclosed" } }) },
        },
      }),
    );

    expect(getServiceConfig("vpc").fields.cidr).toBeDefined();
    expect(getServiceConfig("vpc").fields.cidr.validation).toBeUndefined();
  });

  it("preserves field order, which is render order", () => {
    hydrateServicesConfig(
      doc({
        eks: {
          displayName: "EKS",
          fields: {
            zebra: field({ name: "zebra" }),
            alpha: field({ name: "alpha" }),
            middle: field({ name: "middle" }),
          },
        },
      }),
    );

    expect(Object.keys(getServiceConfig("eks").fields)).toEqual([
      "zebra",
      "alpha",
      "middle",
    ]);
  });

  it("feeds createDefaultServiceConfig from catalog defaults", () => {
    hydrateServicesConfig(
      doc({
        eks: {
          displayName: "EKS",
          fields: {
            size: field({ defaultValue: "m5.large" }),
            count: field({
              name: "count",
              type: FIELD_TYPES.NUMBER,
              defaultValue: 3,
            }),
          },
        },
      }),
    );

    expect(createDefaultServiceConfig("eks")).toEqual({
      size: "m5.large",
      count: 3,
    });
  });

  // A schemaVersion this build cannot read must not render. The fields would
  // look right and mean something else, which is worse than an error screen.
  it("refuses a schemaVersion it does not understand", () => {
    expect(() => hydrateServicesConfig(doc({}, { schemaVersion: 2 }))).toThrow(
      /schemaVersion 2/,
    );
  });

  it("refuses an empty document", () => {
    expect(() => hydrateServicesConfig(null)).toThrow(/empty/i);
  });
});

// getProviderServices hides a service with `available: false`. aws.js uses it
// for lambda: lambda.tf generates fine but expects deployment packages the
// wizard cannot supply, so a plain apply fails (OpenPrime-151). The catalog has
// to carry the flag as a real boolean — "false" is truthy against `!== false`
// and would put the service back on offer.
describe("hydrateServicesConfig and service availability", () => {
  it("keeps a service the catalog marks unavailable out of the wizard", async () => {
    const { getProviderServices } = await import("../providersConfig");

    hydrateServicesConfig(
      doc({
        eks: { displayName: "EKS", fields: { size: field() } },
        lambda: {
          displayName: "Lambda",
          available: false,
          fields: { size: field() },
        },
      }),
    );

    expect(getProviderServices("aws")).toContain("eks");
    expect(getProviderServices("aws")).not.toContain("lambda");
  });

  it("offers a service the catalog says nothing about", async () => {
    const { getProviderServices } = await import("../providersConfig");

    hydrateServicesConfig(
      doc({ lambda: { displayName: "Lambda", fields: { size: field() } } }),
    );

    expect(getProviderServices("aws")).toContain("lambda");
  });
});
