import { formatDateTime, formatRelative } from "@/components/shared/format";

const NOW = Date.parse("2026-11-25T12:00:00Z");
const ago = (seconds) => new Date(NOW - seconds * 1000).toISOString();

describe("formatRelative", () => {
  // "now", as the doc comment promises, not Intl's "this minute".
  it.each([0, 30, 59])("reads %s seconds ago as now", (seconds) => {
    expect(formatRelative(ago(seconds), NOW)).toBe("now");
  });

  it.each([
    [60, "1 minute ago"],
    [5 * 60, "5 minutes ago"],
    [3 * 3600, "3 hours ago"],
    [86_400, "yesterday"],
    [3 * 86_400, "3 days ago"],
    [-14 * 86_400, "in 2 weeks"],
    [400 * 86_400, "last year"],
  ])("reads %s seconds ago as %s", (seconds, text) => {
    expect(formatRelative(ago(seconds), NOW)).toBe(text);
  });
});

describe("formatDateTime", () => {
  it("prints the absolute time in UTC", () => {
    expect(formatDateTime("2026-11-25T08:05:00Z")).toBe(
      "Nov 25, 2026, 8:05 AM UTC",
    );
  });
});
