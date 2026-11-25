import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DynamicFieldRenderer from "../DynamicFieldRenderer";
import { FIELD_TYPES } from "../../config/services/fieldTypes";

describe("DynamicFieldRenderer - multiselect", () => {
  // An HTML id holds no spaces, while option values may.
  it("labels every option with a valid id, whatever its value", () => {
    render(
      <DynamicFieldRenderer
        fieldConfig={{
          type: FIELD_TYPES.MULTISELECT,
          displayName: "Log types",
          options: [
            { value: "audit log", label: "Audit log" },
            { value: "api", label: "API" },
          ],
        }}
        value={["api"]}
        onChange={() => {}}
        fieldName="logTypes"
      />,
    );
    const audit = screen.getByRole("checkbox", { name: "Audit log" });
    expect(audit.id).not.toMatch(/\s/);
    expect(audit).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "API" })).toBeChecked();
  });
});
