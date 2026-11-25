import { getProviderRegions } from "../../config/providersConfig";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const PROVIDERS = [
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "Google Cloud" },
  { value: "onpremise", label: "On-premises" },
];

const PreferencesTab = ({ userPreferences, onPreferenceChange }) => {
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
              onChange={(e) =>
                onPreferenceChange("defaultProvider", e.target.value)
              }
            >
              {PROVIDERS.map((p) => (
                <NativeSelectOption key={p.value} value={p.value}>
                  {p.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          }
        />
        <SettingsRow
          title="Default region"
          description="The list follows the provider above."
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
