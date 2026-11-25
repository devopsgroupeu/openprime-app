// A chart's custom values: the YAML text kept under
// services.<k8s>.helmCharts.<chart>.values, with customValues: true. They are
// saved with the environment; generation does not apply them yet.

/** The custom values of a chart entry, "" when it has none. */
export const chartValues = (entry) =>
  typeof entry?.values === "string" ? entry.values : "";

/** The entry with `values` saved, or without values (customValues off) for "". */
export const withValues = (entry, values) => {
  const { values: _previous, ...rest } = entry || {};
  return values
    ? { ...rest, customValues: true, values }
    : { ...rest, customValues: false };
};

/**
 * The entry a preset (on) or Clear all (off) writes: the plain
 * `{ enabled, customValues: false }` as always, keeping stored values.
 */
export const rebuiltChart = (entry, enabled) =>
  withValues({ enabled }, chartValues(entry));
