// src/components/DynamicFieldRenderer.js
// One catalog field: label, control, help text (aria-describedby) and, where
// the field can be wrong, an error under it (aria-invalid).
import React from "react";
import { TriangleAlert } from "lucide-react";
import { FIELD_TYPES } from "../config/servicesConfig";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Ids joined for aria-describedby; undefined when there is nothing to point at.
const describedBy = (...ids) => ids.filter(Boolean).join(" ") || undefined;

const DynamicFieldRenderer = ({
  fieldConfig,
  value,
  onChange,
  fieldName,
  disabled = false,
}) => {
  const id = React.useId();
  // Initialize all hooks at the top level
  const [jsonText, setJsonText] = React.useState(
    typeof value === "object" && fieldConfig.type === FIELD_TYPES.OBJECT
      ? JSON.stringify(value, null, 2)
      : "",
  );
  const [jsonError, setJsonError] = React.useState("");
  // A list field's text as typed, empty lines included.
  const [listText, setListText] = React.useState("");

  React.useEffect(() => {
    // Update JSON text when value changes from outside
    if (fieldConfig.type === FIELD_TYPES.OBJECT) {
      setJsonText(
        typeof value === "object" ? JSON.stringify(value, null, 2) : "",
      );
    }
  }, [value, fieldConfig.type]);

  const handleChange = (newValue) => {
    onChange(fieldName, newValue);
  };

  const descId = fieldConfig.description ? `${id}-description` : undefined;
  const description = fieldConfig.description ? (
    <FieldDescription id={descId}>{fieldConfig.description}</FieldDescription>
  ) : null;

  // Label over the control, help text and notes under it. A plain function,
  // not a component, so the control keeps its focus across renders.
  const field = (control, after = null) => (
    <div
      data-slot="dynamic-field"
      className="flex min-w-0 flex-col gap-1.5 [&>[data-slot=native-select-wrapper]]:w-full"
    >
      <Label htmlFor={id}>{fieldConfig.displayName}</Label>
      {control}
      {description}
      {after}
    </div>
  );

  switch (fieldConfig.type) {
    case FIELD_TYPES.TOGGLE:
      return (
        <div
          data-slot="dynamic-field"
          className="flex items-start justify-between gap-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <Label htmlFor={id} className="leading-snug">
              {fieldConfig.displayName}
            </Label>
            {description}
          </div>
          <Switch
            id={id}
            // A string toggle stores "true" or "false"; "false" is off.
            checked={value === true || value === "true"}
            onCheckedChange={(checked) => !disabled && handleChange(checked)}
            disabled={disabled}
            aria-describedby={descId}
          />
        </div>
      );

    case FIELD_TYPES.DROPDOWN: {
      // A stored value the option list no longer offers has to stay visible.
      // A plain controlled <select> whose value matches no <option> does NOT
      // render blank: the browser falls back to the FIRST option, so an
      // environment saved with EKS 1.32 would display "1.34" while still
      // holding 1.32 (onChange never fires, so nothing corrects it). The user
      // then sees a value the environment does not have, and a save is
      // rejected by configValidator for a version the UI never showed them.
      //
      // This is not a one-off for today's EKS bump: option lists that track a
      // vendor's supported versions rotate (roughly every 4 months for EKS),
      // so every rotation orphans the environments sitting on the dropped
      // value. Handling it here fixes the class for every dropdown rather than
      // once per list.
      //
      // Rendered `disabled` so it shows as the current selection but cannot be
      // chosen again once the user moves off it. Compared as text: the select
      // hands a numeric option (3 AZs) over as "3".
      const options = fieldConfig.options ?? [];
      const isOrphaned =
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !options.some((option) => String(option.value) === String(value));
      const orphanId = isOrphaned ? `${id}-orphan` : undefined;

      return field(
        <NativeSelect
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          aria-describedby={describedBy(orphanId, descId)}
        >
          {isOrphaned && (
            <NativeSelectOption key={value} value={value} disabled>
              {`${value} (no longer supported)`}
            </NativeSelectOption>
          )}
          {options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>,
        isOrphaned && (
          <p id={orphanId} className="flex items-start gap-1.5 text-xs">
            <TriangleAlert
              aria-hidden
              className="mt-px size-3.5 shrink-0 text-warning"
            />
            This environment uses a value that is no longer offered. Pick a
            supported one before saving.
          </p>
        ),
      );
    }

    case FIELD_TYPES.MULTISELECT:
      return (
        <fieldset
          data-slot="dynamic-field"
          className="flex min-w-0 flex-col gap-1.5"
          aria-describedby={descId}
        >
          <legend className="mb-1.5 text-sm font-medium">
            {fieldConfig.displayName}
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {fieldConfig.options?.map((option, index) => {
              // From the index: a value may hold spaces, an id may not.
              const optionId = `${id}-${index}`;
              return (
                <div key={option.value} className="flex items-center gap-2">
                  <Checkbox
                    id={optionId}
                    checked={
                      Array.isArray(value) && value.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      if (!Array.isArray(value)) return;
                      const newValue = checked
                        ? [...value, option.value]
                        : value.filter((v) => v !== option.value);
                      handleChange(newValue);
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={optionId} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
          {description}
        </fieldset>
      );

    case FIELD_TYPES.NUMBER:
      return field(
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
          min={fieldConfig.min}
          max={fieldConfig.max}
          disabled={disabled}
          aria-describedby={descId}
          className="tabular-nums"
        />,
      );

    case FIELD_TYPES.TEXTAREA:
      return field(
        <Textarea
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          rows={4}
          aria-describedby={descId}
        />,
      );

    case FIELD_TYPES.ARRAY: {
      const countId = `${id}-count`;
      const items = Array.isArray(value) ? value : [];
      const count = items.length;
      const toItems = (text) =>
        text.split("\n").filter((line) => line.trim() !== "");
      // The items are stored without empty lines. The typed text is shown as
      // long as it reads as the same items, so the new line after Enter stays;
      // a list set from outside (Aura) replaces it.
      const text =
        toItems(listText).join("\n") === items.join("\n")
          ? listText
          : items.join("\n");
      return field(
        <Textarea
          id={id}
          value={text}
          onChange={(e) => {
            setListText(e.target.value);
            handleChange(toItems(e.target.value));
          }}
          onBlur={() => setListText(items.join("\n"))}
          disabled={disabled}
          rows={4}
          placeholder="Enter one item per line"
          aria-describedby={describedBy(descId, count > 0 && countId)}
          className="min-h-20 font-mono text-xs md:text-xs"
        />,
        count > 0 && (
          <p
            id={countId}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {count} item{count !== 1 ? "s" : ""}
          </p>
        ),
      );
    }

    case FIELD_TYPES.OBJECT: {
      const errorId = `${id}-error`;
      // One helper line: the catalog description, else this generic one.
      const hintId = fieldConfig.description ? undefined : `${id}-hint`;
      return field(
        <Textarea
          id={id}
          value={jsonText}
          onChange={(e) => {
            const newText = e.target.value;
            setJsonText(newText);

            try {
              const parsed = JSON.parse(newText);
              handleChange(parsed);
              setJsonError("");
            } catch (error) {
              // Invalid JSON - show error but allow typing
              setJsonError(error.message);
            }
          }}
          onBlur={() => {
            // On blur, try to format valid JSON
            try {
              const parsed = JSON.parse(jsonText);
              const formatted = JSON.stringify(parsed, null, 2);
              setJsonText(formatted);
              setJsonError("");
            } catch {
              // Keep invalid JSON as-is
            }
          }}
          disabled={disabled}
          rows={6}
          placeholder='{"key": "value"}'
          spellCheck="false"
          aria-invalid={jsonError ? true : undefined}
          aria-describedby={describedBy(jsonError ? errorId : hintId, descId)}
          className="min-h-20 font-mono text-xs md:text-xs"
        />,
        jsonError ? (
          <FieldError id={errorId}>Invalid JSON: {jsonError}</FieldError>
        ) : hintId ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            JSON format
          </p>
        ) : null,
      );
    }

    case FIELD_TYPES.TEXT:
    default:
      return field(
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          aria-describedby={descId}
        />,
      );
  }
};

export default DynamicFieldRenderer;
