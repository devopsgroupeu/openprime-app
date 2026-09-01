import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DynamicFieldRenderer from "../DynamicFieldRenderer";
import { FIELD_TYPES } from "../../config/services/fieldTypes";

// Option lists that mirror a vendor's supported versions rotate — EKS drops one
// and gains one roughly every 4 months. Each rotation orphans every stored
// environment sitting on the dropped value, so this is a recurring class, not a
// one-off migration after the 1.34-1.36 bump.
//
// Measured before this guard existed: a controlled <select> whose value matches
// no <option> does NOT render blank. The browser falls back to the FIRST
// option, and onChange never fires — so the wizard displayed "1.34" for an
// environment actually holding "1.32", with the stored value left intact.

const cfg = (over = {}) => ({
  type: FIELD_TYPES.DROPDOWN,
  name: "kubernetesVersion",
  displayName: "Kubernetes Version",
  options: ["1.34", "1.35", "1.36"].map((v) => ({ value: v, label: v })),
  ...over,
});

const renderField = (value, onChange = () => {}) =>
  render(
    <DynamicFieldRenderer
      fieldConfig={cfg()}
      value={value}
      onChange={onChange}
      fieldName="kubernetesVersion"
    />,
  );

describe("DynamicFieldRenderer — dropdown with an orphaned stored value", () => {
  it("shows the stored value instead of silently falling back to the first option", () => {
    const { container } = renderField("1.32");
    const select = container.querySelector("select");

    // The whole point: the select reflects what the environment actually holds.
    expect(select.value).toBe("1.32");
    expect(select.value).not.toBe("1.34");
  });

  it("labels it so the user knows why it is there", () => {
    renderField("1.32");
    expect(screen.getByText("1.32 — no longer supported")).toBeInTheDocument();
    expect(
      screen.getByText(/no longer offered\. Pick a supported one/i),
    ).toBeInTheDocument();
  });

  it("does not let the orphaned value be chosen again", () => {
    const { container } = renderField("1.32");
    const orphan = [...container.querySelectorAll("option")].find(
      (o) => o.value === "1.32",
    );
    expect(orphan.disabled).toBe(true);
  });

  it("never mutates the stored value on its own", () => {
    // Silently rewriting to a supported version would change infrastructure
    // the user never asked to change. Correcting it must stay an explicit act.
    const onChange = vi.fn();
    renderField("1.32", onChange);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("leaves a supported value completely untouched", () => {
    // Control: no extra option, no warning, no behaviour change for the
    // overwhelmingly common case.
    const { container } = renderField("1.35");
    expect(container.querySelector("select").value).toBe("1.35");
    expect(container.querySelectorAll("option")).toHaveLength(3);
    expect(screen.queryByText(/no longer supported/i)).toBeNull();
  });

  it("adds nothing for an empty or absent value", () => {
    // A brand-new field has no value yet; that is not an orphan and must not
    // render a bogus "" option.
    for (const v of ["", undefined, null]) {
      const { container, unmount } = render(
        <DynamicFieldRenderer
          fieldConfig={cfg()}
          value={v}
          onChange={() => {}}
          fieldName="kubernetesVersion"
        />,
      );
      expect(container.querySelectorAll("option")).toHaveLength(3);
      unmount();
    }
  });

  it("survives a field config with no options at all", () => {
    const { container } = render(
      <DynamicFieldRenderer
        fieldConfig={cfg({ options: undefined })}
        value="1.32"
        onChange={() => {}}
        fieldName="kubernetesVersion"
      />,
    );
    // Still shows what is stored rather than throwing on options.some().
    expect(container.querySelector("select").value).toBe("1.32");
  });
});
