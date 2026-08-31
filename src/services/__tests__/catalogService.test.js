import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../authService", () => ({
  default: { get: vi.fn() },
}));

import authService from "../authService";
import { loadCatalog, resetCatalogCache } from "../catalogService";

describe("loadCatalog", () => {
  beforeEach(() => {
    authService.get.mockReset();
    // The cache is module state; without this each test inherits the previous
    // test's document and the assertions stop meaning anything.
    resetCatalogCache();
  });

  it("asks the backend once for concurrent callers", async () => {
    let resolve;
    authService.get.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const a = loadCatalog();
    const b = loadCatalog();
    resolve({ schemaVersion: 1 });

    expect(await a).toBe(await b);
    expect(authService.get).toHaveBeenCalledTimes(1);
  });

  // AuthProvider mounts CatalogProvider a second time once Keycloak resolves.
  // A refetch there is not just a wasted round trip: hydrating twice replaces
  // every service object while components may hold the first set.
  it("serves a remount from the cache instead of asking again", async () => {
    authService.get.mockResolvedValue({ schemaVersion: 1 });

    await loadCatalog();
    await loadCatalog();

    expect(authService.get).toHaveBeenCalledTimes(1);
  });

  it("asks again when the caller forces it, which is what retry does", async () => {
    authService.get.mockResolvedValue({ schemaVersion: 1 });

    await loadCatalog();
    await loadCatalog({ force: true });

    expect(authService.get).toHaveBeenCalledTimes(2);
  });

  // Sharing the promise must not turn a transient failure into a permanent one,
  // and a failure must cache nothing.
  it("retries after a failure instead of replaying the rejection", async () => {
    authService.get.mockRejectedValueOnce(new Error("502"));
    await expect(loadCatalog()).rejects.toThrow("502");

    authService.get.mockResolvedValueOnce({ schemaVersion: 1 });
    await expect(loadCatalog()).resolves.toEqual({ schemaVersion: 1 });
  });
});
