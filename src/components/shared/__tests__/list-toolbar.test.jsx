import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListToolbar } from "../list-toolbar";

describe("ListToolbar", () => {
  // Layout is CSS (checked in screenshots): from md the toolbar is a row that
  // wraps, so where tabs, search and sort do not fit side by side (768 to
  // 1024 with the sidebar open) search and sort move under the tabs instead
  // of squeezing them until labels break and overlap the search field.
  it("wraps search and sort under the filter tabs on a narrow row", () => {
    const { container } = render(
      <ListToolbar
        search=""
        onSearchChange={() => {}}
        origins={[{ value: "all", label: "All", count: 1 }]}
        onOriginChange={() => {}}
        resultCount={1}
      />,
    );

    expect(container.querySelector('[data-slot="list-toolbar"]')).toHaveClass(
      "md:flex-row",
      "md:flex-wrap",
    );
  });
});
