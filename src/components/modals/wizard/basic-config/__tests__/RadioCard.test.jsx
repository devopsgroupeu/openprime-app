import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioCard, RadioCardGroup } from "../RadioCard";

describe("RadioCard", () => {
  // Selected already draws ring-2: keyboard focus adds an offset ring so the
  // two stay apart (DESIGN 3.8). jsdom has no :focus-visible, so the recipe
  // is pinned.
  it("shows keyboard focus as a ring around the whole card", () => {
    render(
      <RadioCardGroup aria-label="Bucket" defaultValue="a">
        <RadioCard id="a" value="a" title="Create a new bucket" />
      </RadioCardGroup>,
    );
    const card = screen
      .getByRole("radio", { name: "Create a new bucket" })
      .closest("[data-slot=radio-card]");
    expect(card).toHaveClass(
      "has-[:focus-visible]:ring-2",
      "has-[:focus-visible]:ring-ring",
      "has-[:focus-visible]:ring-offset-2",
      "has-[:focus-visible]:ring-offset-background",
    );
  });
});
