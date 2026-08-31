import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { loadCatalog } from "../services/catalogService";
import {
  hydrateServicesConfig,
  USE_RUNTIME_CATALOG,
} from "../config/servicesConfig";

const CatalogContext = createContext({
  status: "ready",
  commit: null,
  retry: () => {},
});

export const useCatalog = () => useContext(CatalogContext);

/**
 * Loads the wizard catalog before anything renders a wizard.
 *
 * Children are blocked until SERVICES_CONFIG is hydrated, because the wizard
 * builds its initial state from it synchronously — a card rendered against a
 * half-filled config shows an empty service list rather than an error, and an
 * empty service list looks like a product with no services.
 *
 * With the flag off this is inert: SERVICES_CONFIG is already populated from
 * the static files at module load and this provider renders its children
 * immediately.
 */
export function CatalogProvider({ children, fallback = null }) {
  const [status, setStatus] = useState(
    USE_RUNTIME_CATALOG ? "loading" : "ready",
  );
  const [error, setError] = useState(null);
  const [commit, setCommit] = useState(null);

  const fetchCatalog = useCallback(async ({ force = false } = {}) => {
    setStatus("loading");
    setError(null);
    try {
      const doc = await loadCatalog({ force });
      hydrateServicesConfig(doc);
      setCommit(doc.commit || null);
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (USE_RUNTIME_CATALOG) fetchCatalog();
  }, [fetchCatalog]);

  if (status === "loading") return fallback;

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-primary mb-2">
            Service catalog unavailable
          </h1>
          <p className="text-sm text-tertiary mb-6">
            {error?.status === 502
              ? "The catalog service is not responding. Your environments are unaffected."
              : error?.message || "The service catalog could not be loaded."}
          </p>
          <button
            onClick={() => fetchCatalog({ force: true })}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <CatalogContext.Provider
      value={{ status, commit, retry: () => fetchCatalog({ force: true }) }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export default CatalogContext;
