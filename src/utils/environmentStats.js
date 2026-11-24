// Derived views of the environments list: effective status, enabled services,
// the stat strip, status counts and the client-side search, filter and sort.

// The status badge reflects the most recent async job outcome (generate/push)
// when one exists, falling back to the lifecycle status. When both jobs have
// run, the more recent one (by last_*_at) wins.
export const getEffectiveStatus = (environment) => {
  const genAt = environment.last_generate_at;
  const pushAt = environment.last_push_at;
  const gen = environment.last_generate_status;
  const push = environment.last_push_status;
  if (genAt && pushAt) return pushAt > genAt ? push : gen;
  if (genAt) return gen;
  if (pushAt) return push;
  return environment.status || "pending";
};

/** Keys of the services switched on in an environment, in config order. */
export const enabledServices = (environment) =>
  Object.entries(environment.services || {})
    .filter(([, config]) => config?.enabled)
    .map(([key]) => key);

// The API is snake_case; older payloads carry camelCase or `location`.
export const prefixOf = (env) => env.global_prefix || env.globalPrefix || "";
export const regionOf = (env) => env.region || env.location || "";
export const modifiedAt = (env) =>
  env.updated_at || env.updatedAt || env.created_at || env.createdAt;

/** Stat strip: environments, running ones, enabled services and distinct regions. */
export const summarizeEnvironments = (environments) => ({
  total: environments.length,
  running: environments.filter((env) => getEffectiveStatus(env) === "running")
    .length,
  services: environments.reduce(
    (sum, env) => sum + enabledServices(env).length,
    0,
  ),
  regions: new Set(environments.map(regionOf).filter(Boolean)).size,
});

/** `{ status: count }` over the effective statuses. */
export const statusCounts = (environments) =>
  environments.reduce((counts, env) => {
    const status = getEffectiveStatus(env);
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});

const byName = (a, b) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true });

const COMPARE = {
  modified: (a, b) =>
    (Date.parse(modifiedAt(b)) || 0) - (Date.parse(modifiedAt(a)) || 0) ||
    byName(a, b),
  name: byName,
  services: (a, b) =>
    enabledServices(b).length - enabledServices(a).length || byName(a, b),
};

export const SORTS = Object.keys(COMPARE);

/**
 * The cards to show: search over name, prefix and region (case-insensitive),
 * an effective-status filter ("all" for none) and one of SORTS. Returns a new
 * array; the input keeps its order.
 */
export const filterAndSortEnvironments = (
  environments,
  { query, status, sort },
) => {
  const q = query.trim().toLowerCase();
  return environments
    .filter(
      (env) =>
        (status === "all" || getEffectiveStatus(env) === status) &&
        (q === "" ||
          [env.name, prefixOf(env), regionOf(env)].some((field) =>
            field?.toLowerCase().includes(q),
          )),
    )
    .sort(COMPARE[sort] ?? COMPARE.modified);
};
