import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import DynamicFieldRenderer from "../DynamicFieldRenderer";
import { FIELD_TYPES } from "../../config/services/fieldTypes";

// A list field (one item per line) stores the items without empty lines, but
// while typing the empty line after Enter has to stay, or no second item can
// ever be started.
function Harness({ initial = [], onValue }) {
  const [value, setValue] = useState(initial);
  return (
    <DynamicFieldRenderer
      fieldConfig={{ type: FIELD_TYPES.ARRAY, displayName: "Bucket Names" }}
      value={value}
      onChange={(_, next) => {
        onValue?.(next);
        setValue(next);
      }}
      fieldName="bucketNames"
    />
  );
}

const field = () => screen.getByLabelText("Bucket Names");

describe("DynamicFieldRenderer - list field", () => {
  it("keeps the new line after Enter while the items stay clean", () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.change(field(), { target: { value: "logs" } });
    fireEvent.change(field(), { target: { value: "logs\n" } });
    expect(field()).toHaveValue("logs\n");
    expect(onValue).toHaveBeenLastCalledWith(["logs"]);

    fireEvent.change(field(), { target: { value: "logs\nassets" } });
    expect(onValue).toHaveBeenLastCalledWith(["logs", "assets"]);
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("drops the empty lines when the field loses focus", () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: "logs\n\n" } });
    fireEvent.blur(field());
    expect(field()).toHaveValue("logs");
  });

  it("shows a list set from outside", () => {
    const { rerender } = render(
      <DynamicFieldRenderer
        fieldConfig={{ type: FIELD_TYPES.ARRAY, displayName: "Bucket Names" }}
        value={["logs"]}
        onChange={() => {}}
        fieldName="bucketNames"
      />,
    );
    rerender(
      <DynamicFieldRenderer
        fieldConfig={{ type: FIELD_TYPES.ARRAY, displayName: "Bucket Names" }}
        value={["assets", "backups"]}
        onChange={() => {}}
        fieldName="bucketNames"
      />,
    );
    expect(field()).toHaveValue("assets\nbackups");
  });
});
