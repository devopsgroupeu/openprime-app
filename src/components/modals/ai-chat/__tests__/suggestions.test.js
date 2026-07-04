import { describe, it, expect } from "vitest";
import { FIELD_TYPES } from "../../../../config/servicesConfig";
import {
  findServiceByDisplayName,
  isValidFieldValue,
  extractSuggestionsFromText,
  validateServiceConfiguration,
} from "../suggestions";

const jsonBlock = (obj) => "```json\n" + JSON.stringify(obj) + "\n```";

describe("findServiceByDisplayName", () => {
  it("maps a known display name to its service key", () => {
    expect(findServiceByDisplayName("Elastic Kubernetes Service (EKS)")).toBe(
      "eks",
    );
  });
  it("returns null for an unknown display name", () => {
    expect(findServiceByDisplayName("Nonexistent Service")).toBeNull();
  });
});

describe("isValidFieldValue", () => {
  it("allows null/undefined for any field", () => {
    expect(isValidFieldValue(null, { type: FIELD_TYPES.TOGGLE })).toBe(true);
    expect(isValidFieldValue(undefined, { type: FIELD_TYPES.NUMBER })).toBe(
      true,
    );
  });
  it("validates toggles as booleans", () => {
    expect(isValidFieldValue(true, { type: FIELD_TYPES.TOGGLE })).toBe(true);
    expect(isValidFieldValue("yes", { type: FIELD_TYPES.TOGGLE })).toBe(false);
  });
  it("enforces number type and min/max bounds", () => {
    const f = { type: FIELD_TYPES.NUMBER, min: 1, max: 5 };
    expect(isValidFieldValue(3, f)).toBe(true);
    expect(isValidFieldValue(0, f)).toBe(false);
    expect(isValidFieldValue(6, f)).toBe(false);
    expect(isValidFieldValue("3", f)).toBe(false);
  });
  it("restricts dropdown values to the defined options", () => {
    const f = {
      type: FIELD_TYPES.DROPDOWN,
      options: [{ value: "a" }, { value: "b" }],
    };
    expect(isValidFieldValue("a", f)).toBe(true);
    expect(isValidFieldValue("z", f)).toBe(false);
  });
  it("validates multiselect membership and array-ness", () => {
    const f = {
      type: FIELD_TYPES.MULTISELECT,
      options: [{ value: "a" }, { value: "b" }],
    };
    expect(isValidFieldValue(["a"], f)).toBe(true);
    expect(isValidFieldValue(["a", "z"], f)).toBe(false);
    expect(isValidFieldValue("a", f)).toBe(false);
  });
});

describe("extractSuggestionsFromText", () => {
  it("returns {} when there is no JSON block", () => {
    expect(extractSuggestionsFromText("just some prose", "eks", {})).toEqual(
      {},
    );
  });
  it("returns {} for a malformed JSON block", () => {
    expect(
      extractSuggestionsFromText("```json\n{ not valid }\n```", "eks", {}),
    ).toEqual({});
  });
  it("returns a validated config that differs from the current one", () => {
    const out = extractSuggestionsFromText(
      jsonBlock({ enabled: true }),
      "eks",
      { services: { eks: { enabled: false } } },
    );
    expect(out).toEqual({ enabled: true });
  });
  it("returns {} when the suggestion equals the current config", () => {
    const out = extractSuggestionsFromText(
      jsonBlock({ enabled: true }),
      "eks",
      { services: { eks: { enabled: true } } },
    );
    expect(out).toEqual({});
  });
  it("drops fields whose values fail type validation", () => {
    const out = extractSuggestionsFromText(
      jsonBlock({ enabled: "not-a-boolean" }),
      "eks",
      { services: { eks: {} } },
    );
    expect(out).toEqual({});
  });
});

describe("validateServiceConfiguration", () => {
  it("returns empty warnings/fixes for an unknown service", () => {
    expect(validateServiceConfiguration("nope", { a: 1 })).toEqual({
      warnings: [],
      fixes: {},
    });
  });
  it("flags a min>max cross-field pair and proposes a fix", () => {
    const { warnings, fixes } = validateServiceConfiguration("eks", {
      minNodes: 5,
      maxNodes: 2,
    });
    expect(warnings).toContain("minNodes cannot exceed maxNodes");
    expect(fixes.maxNodes).toBe(5);
  });
});
