import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DynamicFieldRenderer from "../DynamicFieldRenderer";
import { FIELD_TYPES } from "../../config/services/fieldTypes";

// A JSON field gets one helper line: its catalog description, or "JSON
// format" when it has none. An error uses the wizard's one error size.
const renderJson = (description) =>
  render(
    <DynamicFieldRenderer
      fieldConfig={{
        type: FIELD_TYPES.OBJECT,
        displayName: "Tags",
        description,
      }}
      value={{}}
      onChange={() => {}}
      fieldName="tags"
    />,
  );

describe("DynamicFieldRenderer - JSON field", () => {
  it("shows the description as its only helper line", () => {
    renderJson("Additional AWS tags for all resources (JSON)");
    const field = screen.getByLabelText("Tags");
    expect(field).toHaveAccessibleDescription(
      "Additional AWS tags for all resources (JSON)",
    );
    expect(screen.queryByText("JSON format")).toBeNull();
  });

  it("says JSON format when the catalog gives no description", () => {
    renderJson(undefined);
    expect(screen.getByLabelText("Tags")).toHaveAccessibleDescription(
      "JSON format",
    );
  });

  it("shows invalid JSON at the size of every other field error", () => {
    renderJson("Additional AWS tags for all resources (JSON)");
    const field = screen.getByLabelText("Tags");
    fireEvent.change(field, { target: { value: "{" } });
    expect(field).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByText(/^Invalid JSON/);
    expect(error).toHaveClass("text-sm");
    expect(error).not.toHaveClass("text-xs");
  });
});
