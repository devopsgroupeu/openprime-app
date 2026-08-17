import { getProviderRegions } from "../../config/providersConfig";

const PreferencesTab = ({ userPreferences, onPreferenceChange }) => {
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
          value={userPreferences.defaultProvider}
          onChange={(e) =>
            onPreferenceChange("defaultProvider", e.target.value)
          }
          className="w-full px-4 py-2.5 transition-colors"
        >
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">Google Cloud</option>
          <option value="on-premise">On-Premise</option>
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
          {getProviderRegions(userPreferences.defaultProvider).map((region) => (
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
