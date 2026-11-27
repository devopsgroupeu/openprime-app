import { render, screen } from "@testing-library/react";

import {
  RelativeTime,
  formatAge,
  formatDateTime,
  formatRelative,
} from "@/components/shared/format";
import { TooltipProvider } from "@/components/ui/tooltip";

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

// The same steps as formatRelative, in short for a narrow column.
describe("formatAge", () => {
  it.each([
    [30, "now"],
    [5 * 60, "5m"],
    [2 * 3600, "2h"],
    [86_400, "1d"],
    [9 * 86_400, "1w"],
    [160 * 86_400, "5mo"],
    [400 * 86_400, "1y"],
  ])("reads %s seconds ago as %s", (seconds, text) => {
    expect(formatAge(ago(seconds), NOW)).toBe(text);
  });
});

describe("formatDateTime", () => {
  it("prints the absolute time in UTC", () => {
    expect(formatDateTime("2026-11-25T08:05:00Z")).toBe(
      "Nov 25, 2026, 8:05 AM UTC",
    );
  });
});

describe("RelativeTime", () => {
  // Tooltips are hidden on touch, so the absolute time is also in the name.
  it("names the absolute UTC time next to the relative one", () => {
    render(
      <TooltipProvider>
        <RelativeTime iso="2026-11-25T08:05:00Z" />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button")).toHaveAccessibleName(
      expect.stringContaining("Nov 25, 2026, 8:05 AM UTC"),
    );
  });
});
