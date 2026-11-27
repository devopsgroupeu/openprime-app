import { getProviderRegions } from "../providersConfig";

// The region map places a region by `at` and names it by `city`: a region
// added without them would be counted but never drawn.
describe("AWS regions", () => {
  it.each(getProviderRegions("aws").map((r) => [r.value, r]))(
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
