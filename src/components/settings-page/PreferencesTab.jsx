import {
  getProviderConfig,
  getProviderRegions,
} from "../../config/providersConfig";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

// Azure and Google Cloud are on the roadmap (D-9): they cannot be picked, but
// a stored one still shows as the current value. On-premises stays selectable.
const PROVIDERS = [
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure (Roadmap)", disabled: true },
  { value: "gcp", label: "Google Cloud (Roadmap)", disabled: true },
  { value: "onpremise", label: "On-premises" },
];

const PreferencesTab = ({
  userPreferences,
  savedPreferences,
  onPreferenceChange,
}) => {
  // The select used to send "on-premise"; everything else, providersConfig
  // included, spells it "onpremise". A value stored by the old select is shown
  // as On-premises instead of the first option (OP-271).
  const defaultProvider =
    userPreferences.defaultProvider === "on-premise"
      ? "onpremise"
      : userPreferences.defaultProvider;

  return (
    <SettingsSection title="Defaults">
      <SettingsRowGroup>
        <SettingsRow
          title="Default cloud provider"
          description="The cloud provider you work with most."
          controlId="settings-default-provider"
          control={
            <NativeSelect
              id="settings-default-provider"
              value={defaultProvider}
              onChange={(e) => {
                const provider = e.target.value;
                onPreferenceChange("defaultProvider", provider);
                // The region select lists only this provider's regions: a
                // region it does not offer would show as another one but
                // still be saved. Back on the saved provider, the saved
                // region returns.
                const offered = getProviderRegions(provider).some(
                  (r) => r.value === userPreferences.defaultRegion,
                );
                if (!offered) {
                  onPreferenceChange(
                    "defaultRegion",
                    provider === savedPreferences?.defaultProvider
                      ? savedPreferences.defaultRegion
                      : getProviderConfig(provider).defaultRegion,
                  );
                }
              }}
            >
              {PROVIDERS.map((p) => (
                <NativeSelectOption
                  key={p.value}
                  value={p.value}
                  disabled={p.disabled}
                >
                  {p.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          }
        />
        <SettingsRow
          title="Default region"
          description="Pre-filled in the wizard. You can change it per environment."
          controlId="settings-default-region"
          control={
            <NativeSelect
              id="settings-default-region"
              value={userPreferences.defaultRegion}
              onChange={(e) =>
                onPreferenceChange("defaultRegion", e.target.value)
              }
            >
              {getProviderRegions(defaultProvider).map((region) => (
                <NativeSelectOption key={region.value} value={region.value}>
                  {region.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          }
        />
      </SettingsRowGroup>
    </SettingsSection>
  );
};

export default PreferencesTab;
