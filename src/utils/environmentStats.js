// Derived views of the environments list: effective status and how it reads,
// enabled services, the stat strip, the status filter tabs and the client-side
// search, filter and sort.

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

// How an effective status reads. OpenPrime generates code and never deploys:
// the last job outcome reads Ready or Failed, no job yet reads Not generated,
// a job in flight reads Processing. Legacy lifecycle values stay mapped.
// `key` is the status filter value; `pill` the StatusPill that draws it.
const READY = { key: "ready", tone: "success", pill: "ready", label: "Ready" };
const FAILED = {
  key: "failed",
  tone: "destructive",
  pill: "failed",
  label: "Failed",
};
const PROCESSING = {
  key: "processing",
  tone: "warning",
  pill: "processing",
  label: "Processing",
};
const STATUSES = {
  succeeded: READY,
  running: READY,
  failed: FAILED,
  error: FAILED,
  pending: {
    key: "not-generated",
    tone: "neutral",
    pill: "notGenerated",
    label: "Not generated",
  },
  queued: PROCESSING,
  deploying: PROCESSING,
  stopped: {
    key: "stopped",
    tone: "neutral",
    pill: "stopped",
    label: "Stopped",
  },
  destroyed: {
    key: "destroyed",
    tone: "neutral",
    pill: "unknown",
    label: "Destroyed",
  },
};

/** `{ key, tone, pill, label }` of an effective status; unknown ones read as themselves. */
export const statusDisplay = (status) =>
  STATUSES[status] ?? {
    key: status || "unknown",
    tone: "neutral",
    pill: "unknown",
    label: status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Unknown",
  };

const displayOf = (env) => statusDisplay(getEffectiveStatus(env));

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

/** Stat strip: environments, ready ones, enabled services and distinct regions. */
export const summarizeEnvironments = (environments) => ({
  total: environments.length,
  ready: environments.filter((env) => displayOf(env).key === "ready").length,
  services: environments.reduce(
    (sum, env) => sum + enabledServices(env).length,
    0,
  ),
  regions: new Set(environments.map(regionOf).filter(Boolean)).size,
});

const FIRST = ["ready", "not-generated", "failed"];
const rank = (key) => (FIRST.includes(key) ? FIRST.indexOf(key) : FIRST.length);

/**
 * Status filter tabs `{ value, label, count }` for the statuses that occur:
 * Ready, Not generated and Failed first, then the rest by label.
 */
export const statusFilters = (environments) => {
  const tabs = new Map();
  for (const env of environments) {
    const { key, label } = displayOf(env);
    const tab = tabs.get(key) ?? { value: key, label, count: 0 };
    tab.count += 1;
    tabs.set(key, tab);
  }
  return [...tabs.values()].sort(
    (a, b) => rank(a.value) - rank(b.value) || a.label.localeCompare(b.label),
  );
};

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
 * a status filter key ("all" for none) and one of SORTS. Returns a new array;
 * the input keeps its order.
 */
export const filterAndSortEnvironments = (
  environments,
  { query, status, sort },
) => {
  const q = query.trim().toLowerCase();
  return environments
    .filter(
      (env) =>
        (status === "all" || displayOf(env).key === status) &&
        (q === "" ||
          [env.name, prefixOf(env), regionOf(env)].some((field) =>
            field?.toLowerCase().includes(q),
          )),
    )
    .sort(COMPARE[sort] ?? COMPARE.modified);
};
