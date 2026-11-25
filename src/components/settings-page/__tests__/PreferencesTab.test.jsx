import { render, screen, fireEvent, within } from "@testing-library/react";
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

// No two providers list the same region, so the branch that keeps the region
// on a provider change is pinned here, at the handler.
describe("PreferencesTab provider change", () => {
  it("keeps a region the new provider lists", () => {
    const onPreferenceChange = vi.fn();
    const { provider } = renderTab(
      { defaultProvider: "aws", defaultRegion: "datacenter-1" },
      onPreferenceChange,
    );

    fireEvent.change(provider, { target: { value: "onpremise" } });

    expect(onPreferenceChange.mock.calls).toEqual([
      ["defaultProvider", "onpremise"],
    ]);
  });
});

// D-9: Azure and Google Cloud are on the roadmap. Unlike On-premises (OP-271
// above) they cannot be picked, but a stored one still shows as the current
// value instead of AWS.
describe("PreferencesTab roadmap providers", () => {
  it("offers Azure and Google Cloud only as disabled roadmap options", () => {
    const { provider } = renderTab({ defaultProvider: "aws" });
    const option = (name) => within(provider).getByRole("option", { name });

    expect(option("Azure (Roadmap)")).toBeDisabled();
    expect(option("Google Cloud (Roadmap)")).toBeDisabled();
    expect(option("AWS")).toBeEnabled();
    expect(option("On-premises")).toBeEnabled();
  });

  it.each([
    ["azure", "Azure (Roadmap)", "East US"],
    ["gcp", "Google Cloud (Roadmap)", "US Central (Iowa)"],
  ])(
    "still shows a stored %s as the current provider",
    (stored, label, region) => {
      const { provider, regionLabels } = renderTab({ defaultProvider: stored });

      expect(provider).toHaveValue(stored);
      expect(provider).toHaveDisplayValue(label);
      expect(regionLabels()).toContain(region);
    },
  );
});
