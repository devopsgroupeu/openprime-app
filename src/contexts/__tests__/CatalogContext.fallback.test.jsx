import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// The catalog is an internal service reached through the backend. If it is
// unreachable the wizard must degrade to the static config — what every user
// sees today — rather than take app.openprime.io down for everyone.
//
// This used to render a full-screen "Service catalog unavailable" screen
// INSTEAD of the children, which meant one unreachable pod = total outage.
//
// NOTE ON HOW THIS IS SET UP. An earlier version of this file mocked
// servicesConfig with importOriginal() and overrode USE_RUNTIME_CATALOG to
// true. That does not work and silently proves nothing: importOriginal()
// evaluates the real module, where SERVICES_CONFIG is built at module load from
// the *real* flag (false in tests), so the flag-on branch is never exercised.
// A mutation reverting the seed to the old flag-on-empty behaviour still passed.
// The flag has to be set BEFORE the module is evaluated, hence resetModules()
// plus dynamic import.

vi.mock("../../services/catalogService", () => ({
  loadCatalog: vi.fn(),
  resetCatalogCache: vi.fn(),
}));

async function loadWithFlagOn() {
  vi.resetModules();
  window._env_ = { USE_RUNTIME_CATALOG: "true" };

  const servicesConfig = await import("../../config/servicesConfig");
  const { CatalogProvider } = await import("../CatalogContext");
  const { loadCatalog } = await import("../../services/catalogService");

  // Guard the setup itself: if the flag did not actually take, every assertion
  // below would pass against the flag-off path and mean nothing.
  expect(servicesConfig.USE_RUNTIME_CATALOG).toBe(true);

  return { servicesConfig, CatalogProvider, loadCatalog };
}

describe("CatalogProvider — catalog failure degrades, never blocks", () => {
  let warn;

  beforeEach(() => {
    vi.clearAllMocks();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    delete window._env_;
  });

  it("renders children when the catalog fetch fails", async () => {
    const { CatalogProvider, loadCatalog } = await loadWithFlagOn();
    const err = new Error("catalog service is not responding");
    err.status = 502;
    loadCatalog.mockRejectedValue(err);

    render(
      <CatalogProvider fallback={<div>loading</div>}>
        <div data-testid="app">the app</div>
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(screen.queryByText(/Service catalog unavailable/i)).toBeNull();
  });

  it("leaves the static AWS services intact after a failure", async () => {
    // The fallback is only real if SERVICES_CONFIG still describes AWS. Seeded
    // empty under flag-on, children would render an empty service list — a
    // product with no services, which is worse than an error screen.
    const { CatalogProvider, loadCatalog, servicesConfig } =
      await loadWithFlagOn();
    loadCatalog.mockRejectedValue(new Error("boom"));

    render(
      <CatalogProvider>
        <div data-testid="app">the app</div>
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());

    expect(servicesConfig.SERVICES_CONFIG.eks).toBeDefined();
    expect(servicesConfig.SERVICES_CONFIG.vpc).toBeDefined();
    expect(Object.keys(servicesConfig.SERVICES_CONFIG).length).toBeGreaterThan(
      5,
    );
  });

  it("a successful hydration still REPLACES the static AWS services", async () => {
    // The fallback seed must not weaken the flag-on path: a service the catalog
    // does not describe has to disappear, or the catalog stops being the source
    // of truth and OP-210 can never delete aws.js.
    const { CatalogProvider, loadCatalog, servicesConfig } =
      await loadWithFlagOn();
    loadCatalog.mockResolvedValue({
      schemaVersion: 1,
      provider: "aws",
      commit: "abc123",
      services: {
        eks: {
          displayName: "EKS",
          description: "",
          category: "compute",
          fields: {},
        },
      },
    });

    render(
      <CatalogProvider>
        <div data-testid="app">the app</div>
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());

    expect(servicesConfig.SERVICES_CONFIG.eks).toBeDefined();
    // vpc came from the static seed and the catalog dropped it.
    expect(servicesConfig.SERVICES_CONFIG.vpc).toBeUndefined();
    // Azure/GCP/on-prem are the STATIC_SEED and must survive either way.
    expect(servicesConfig.SERVICES_CONFIG.aks).toBeDefined();
  });

  it("says so in the console rather than failing silently", async () => {
    const { CatalogProvider, loadCatalog } = await loadWithFlagOn();
    loadCatalog.mockRejectedValue(new Error("boom"));

    render(
      <CatalogProvider>
        <div data-testid="app">the app</div>
      </CatalogProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("app")).toBeInTheDocument());
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("falling back to the static service config"),
      expect.anything(),
    );
  });
});
