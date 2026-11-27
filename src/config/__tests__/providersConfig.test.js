import { PROVIDERS_CONFIG, getProviderRegions } from "../providersConfig";

// The region map places a region by `at` and names it by `city`: a cloud
// region added without them would be counted but never drawn.
describe.each(["aws", "azure", "gcp"])("%s regions", (provider) => {
  it.each(getProviderRegions(provider).map((r) => [r.value, r]))(
    "%s has a city and a place on the map",
    (_, region) => {
      expect(region.city).toEqual(expect.any(String));
      const [lon, lat] = region.at;
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
      expect(lat).toBeGreaterThanOrEqual(-58);
      expect(lat).toBeLessThanOrEqual(80);
    },
  );
});

// An on-premise "region" is a datacenter of the customer's: no place to draw.
it("leaves on-premise datacenters off the map", () => {
  for (const region of getProviderRegions("onpremise")) {
    expect(region.at).toBeUndefined();
  }
});

// Filter tabs, the map legend and the services groups name a provider in short.
it.each(Object.entries(PROVIDERS_CONFIG))(
  "%s has a short name",
  (_, provider) => {
    expect(provider.shortName).toEqual(expect.any(String));
  },
);
