import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HelmValuesDialog from "../HelmValuesDialog";

// The yaml parser is a lazy chunk: these tests make its import fail or wait.
function Harness({ onSave }) {
  const [open, setOpen] = useState(true);
  return (
    <HelmValuesDialog
      chartKey="prometheusStack"
      open={open}
      onOpenChange={setOpen}
      values=""
      onSave={onSave}
    />
  );
}

const dialog = () => screen.getByRole("dialog");
const editor = () => within(dialog()).getByRole("textbox", { name: "Values" });
const saveButton = () =>
  within(dialog()).getByRole("button", { name: "Save values" });
const typeAndSave = (text) => {
  fireEvent.change(editor(), { target: { value: text } });
  fireEvent.click(saveButton());
};

afterEach(() => {
  vi.doUnmock("yaml");
  vi.resetModules();
});

describe("HelmValuesDialog when the parser is late or missing", () => {
  // A deploy replaces the hashed chunk; offline has the same effect.
  it("says so, keeps the text and lets Save run again when the parser cannot load", async () => {
    vi.doMock("yaml", () => {
      throw new Error("Failed to fetch dynamically imported module");
    });
    const onSave = vi.fn();
    render(<Harness onSave={onSave} />);
    typeAndSave("grafana:\n  replicas: 2");

    expect(
      await within(dialog()).findByText(
        "Could not check the values. Reload the page and try again.",
      ),
    ).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
    expect(editor()).toHaveValue("grafana:\n  replicas: 2");
    // The values are not wrong; the check did not run.
    expect(editor()).not.toHaveAttribute("aria-invalid");
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each([
    ["valid", "grafana:\n  replicas: 2"],
    ["invalid", "grafana:\n  replicas: 2\n bad: x"],
  ])(
    "drops a check that ends after the dialog closed (%s text)",
    async (_, text) => {
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      vi.doMock("yaml", async () => {
        await gate;
        return vi.importActual("yaml");
      });
      const onSave = vi.fn();
      render(<Harness onSave={onSave} />);
      typeAndSave(text);
      fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

      await act(async () => {
        release();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(onSave).not.toHaveBeenCalled();
    },
  );
});
