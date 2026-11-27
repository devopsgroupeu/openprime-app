import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DynamicFieldRenderer from "../DynamicFieldRenderer";
import { FIELD_TYPES } from "../../config/services/fieldTypes";

// A toggle of `valueType: "string"` can be stored as "true" or "false"
// (OpenSearch allowExplicitIndex); the string "false" is off.
const renderToggle = (value, onChange = () => {}) =>
  render(
    <DynamicFieldRenderer
      fieldConfig={{
        type: FIELD_TYPES.TOGGLE,
        displayName: "Allow explicit index",
        valueType: "string",
      }}
      value={value}
      onChange={onChange}
      fieldName="allowExplicitIndex"
    />,
  );

describe("DynamicFieldRenderer toggle", () => {
  it.each([
    [true, true],
    ["true", true],
    [false, false],
    ["false", false],
    [undefined, false],
  ])("shows %j as %s", (value, on) => {
    renderToggle(value);
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      String(on),
    );
  });

  it("switches a stored string false on", () => {
    const onChange = vi.fn();
    renderToggle("false", onChange);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("allowExplicitIndex", true);
  });
});
