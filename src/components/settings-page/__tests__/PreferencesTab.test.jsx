import { render, screen, fireEvent } from "@testing-library/react";
import PreferencesTab from "../PreferencesTab";

// OP-271: the select sent "on-premise" while the rest of the app (and
// providersConfig) spells it "onpremise". getProviderConfig falls back to
// AWS for an unknown key, so On-Premise showed AWS regions.
function renderTab(preferences, onPreferenceChange = () => {}) {
  render(
    <PreferencesTab
      userPreferences={{
        theme: "light",
        notifications: true,
        defaultRegion: "",
        ...preferences,
      }}
      onPreferenceChange={onPreferenceChange}
    />,
  );
  return {
    provider: screen.getByLabelText(/default cloud provider/i),
    regionLabels: () => screen.getAllByRole("option").map((o) => o.textContent),
  };
}

describe("PreferencesTab default provider", () => {
  it("sends onpremise, the spelling the rest of the app uses", () => {
    const onPreferenceChange = vi.fn();
    const { provider } = renderTab(
      { defaultProvider: "aws" },
      onPreferenceChange,
    );

    fireEvent.change(provider, { target: { value: "onpremise" } });

    expect(onPreferenceChange).toHaveBeenCalledWith(
      "defaultProvider",
      "onpremise",
    );
  });

  it("shows on-premise regions for onpremise, not AWS ones", () => {
    const { provider, regionLabels } = renderTab({
      defaultProvider: "onpremise",
    });

    expect(provider.value).toBe("onpremise");
    expect(regionLabels()).toContain("Datacenter 1");
    expect(
      regionLabels().some((label) =>
        /Ireland|Virginia|eu-west-1|us-east-1/.test(label),
      ),
    ).toBe(false);
  });

  it("still shows a preference stored by the old select as On-Premise", () => {
    const { provider, regionLabels } = renderTab({
      defaultProvider: "on-premise",
    });

    expect(provider.value).toBe("onpremise");
    expect(regionLabels()).toContain("Datacenter 1");
  });

  it("control: AWS still shows AWS regions", () => {
    const { provider, regionLabels } = renderTab({ defaultProvider: "aws" });

    expect(provider.value).toBe("aws");
    expect(regionLabels()).not.toContain("Datacenter 1");
  });
});
