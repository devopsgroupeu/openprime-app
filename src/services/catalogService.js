// src/services/catalogService.js
import authService from "./authService";

// The catalog is fetched once per page load and shared from here.
//
// AuthProvider withholds its children until Keycloak resolves, then renders
// them, which mounts CatalogProvider a second time; StrictMode doubles that
// again in development. Refetching is not only a wasted round trip —
// hydrateServicesConfig replaces every service object in SERVICES_CONFIG, so a
// second hydration hands out new objects to components already holding the old
// ones.
//
// `inFlight` collapses concurrent callers, `cached` collapses sequential ones.
// A page load still asks the backend for a fresh document; only a remount
// within the same load reuses it. A failure caches nothing, so retry retries.
let inFlight = null;
let cached = null;

/**
 * Fetch the wizard catalog the backend proxies from Injecto.
 *
 * The backend answers 502 with `catalog_unavailable` when it has nothing to
 * serve, which is the one case the UI can act on — it means retry, not
 * "something is broken forever". Pass `{ force: true }` to bypass the cache,
 * which is what the error screen's retry button does.
 */
export function loadCatalog({ force = false } = {}) {
  if (force) cached = null;
  if (cached) return Promise.resolve(cached);

  if (!inFlight) {
    inFlight = authService
      .get("/catalog")
      .then((doc) => {
        cached = doc;
        return doc;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Drop the cached document. Exists for tests: the cache is module state. */
export function resetCatalogCache() {
  cached = null;
  inFlight = null;
}

export default { loadCatalog };
