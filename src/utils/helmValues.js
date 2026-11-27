// A chart's custom values: the YAML text kept under
// services.<k8s>.helmCharts.<chart>.values, with customValues: true. They are
// saved with the environment; generation does not apply them yet.

/** The custom values of a chart entry, "" when it has none (or only blanks). */
export const chartValues = (entry) =>
  typeof entry?.values === "string" && entry.values.trim() ? entry.values : "";

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

// Every chart entry without its values text.
const withoutValues = (helmCharts) =>
  Object.fromEntries(
    Object.entries(helmCharts).map(([key, entry]) => {
      if (!entry || typeof entry !== "object") return [key, entry];
      const { values: _values, ...rest } = entry;
      return [key, rest];
    }),
  );

/**
 * `services` for Aura: the same, except that chart entries lose their custom
 * values text (it only needs which charts are on). Entries without values
 * serialize exactly as before.
 */
export const withoutChartValues = (services) => {
  if (!services || typeof services !== "object") return services;
  return Object.fromEntries(
    Object.entries(services).map(([name, config]) => [
      name,
      config?.helmCharts && typeof config.helmCharts === "object"
        ? { ...config, helmCharts: withoutValues(config.helmCharts) }
        : config,
    ]),
  );
};
