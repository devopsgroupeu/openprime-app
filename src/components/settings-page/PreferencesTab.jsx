import { getProviderRegions } from "../../config/providersConfig";

const PreferencesTab = ({ userPreferences, onPreferenceChange }) => {
  // The select used to send "on-premise"; everything else, providersConfig
  // included, spells it "onpremise". A value stored by the old select is shown
  // as On-Premise instead of the first option (OP-271).
  const defaultProvider =
    userPreferences.defaultProvider === "on-premise"
      ? "onpremise"
      : userPreferences.defaultProvider;

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="settings-default-provider"
          className="block text-sm font-semibold text-label mb-2"
        >
          Default Cloud Provider
        </label>
        <select
          id="settings-default-provider"
          value={defaultProvider}
          onChange={(e) =>
            onPreferenceChange("defaultProvider", e.target.value)
          }
          className="w-full px-4 py-2.5 transition-colors"
        >
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">Google Cloud</option>
          <option value="onpremise">On-Premise</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="settings-default-region"
          className="block text-sm font-semibold text-label mb-2"
        >
          Default Region
        </label>
        <select
          id="settings-default-region"
          value={userPreferences.defaultRegion}
          onChange={(e) => onPreferenceChange("defaultRegion", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
        >
          {getProviderRegions(defaultProvider).map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PreferencesTab;
