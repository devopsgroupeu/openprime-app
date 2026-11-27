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
 * Loads the wizard catalog into SERVICES_CONFIG.
 *
 * Children render at once, so the shell and the page stay mounted when the
 * catalog arrives. A page that reads SERVICES_CONFIG counts
 * `status === "loading"` as its own loading state; the wizard opens only after
 * it, because it builds its initial state from it synchronously: a card
 * rendered against a half-filled config shows an empty service list rather
 * than an error, and an empty service list looks like a product with no
 * services.
 *
 * With the flag off this is inert: SERVICES_CONFIG is already populated from
 * the static files at module load and `status` starts "ready".
 */
export function CatalogProvider({ children }) {
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

  // A failed catalog fetch is NOT a failed app. SERVICES_CONFIG is seeded with
  // the static AWS config at module load, so nothing hydrating leaves the
  // wizard exactly as it renders with the flag off — which is what every user
  // sees today. Blocking here instead would turn one unreachable internal
  // service into a total outage of app.openprime.io for everyone.
  //
  // The trade-off, stated because it is real: the degradation is silent to the
  // user. `status` is exposed on the context so a surface that cares can say
  // so, and the failure is visible in the browser console and in the backend's
  // own 502 rate. If this ever needs to be loud, add a banner here — do not go
  // back to blocking.
  if (status === "error") {
    console.warn(
      "[catalog] falling back to the static service config:",
      error?.message || error,
    );
  }

  return (
    <CatalogContext.Provider
      value={{
        status,
        commit,
        error,
        retry: () => fetchCatalog({ force: true }),
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export default CatalogContext;
