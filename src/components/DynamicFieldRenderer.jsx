// src/components/DynamicFieldRenderer.js
// One catalog field: label, control, help text (aria-describedby) and, where
// the field can be wrong, an error under it (aria-invalid).
import React from "react";
import { ChevronRight, Plus, TriangleAlert } from "lucide-react";
import { FIELD_TYPES } from "../config/servicesConfig";
import { Button } from "@/components/ui/button";
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
  const [expandedIndex, setExpandedIndex] = React.useState(null);
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
            checked={Boolean(value)}
            onCheckedChange={() => !disabled && handleChange(!value)}
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
            {fieldConfig.options?.map((option) => {
              const optionId = `${id}-${option.value}`;
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
      const hintId = `${id}-hint`;
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
          <FieldError id={errorId} className="text-xs">
            Invalid JSON: {jsonError}
          </FieldError>
        ) : (
          <p id={hintId} className="text-xs text-muted-foreground">
            JSON format
          </p>
        ),
      );
    }

    case FIELD_TYPES.DYNAMIC_LIST: {
      const listValue = Array.isArray(value) ? value : [];

      const createDefaultItem = () => {
        const defaultItem = {};
        Object.entries(fieldConfig.itemSchema).forEach(([key, schema]) => {
          defaultItem[key] =
            schema.defaultValue !== undefined
              ? schema.defaultValue
              : schema.type === FIELD_TYPES.TOGGLE
                ? false
                : schema.type === FIELD_TYPES.NUMBER
                  ? 0
                  : "";
        });
        return defaultItem;
      };

      const addItem = () => {
        const newItem = createDefaultItem();
        const newList = [...listValue, newItem];
        handleChange(newList);
        setExpandedIndex(newList.length - 1);
      };

      const removeItem = (index) => {
        const newList = listValue.filter((_, i) => i !== index);
        handleChange(newList);
        if (expandedIndex === index) {
          setExpandedIndex(null);
        } else if (expandedIndex > index) {
          setExpandedIndex(expandedIndex - 1);
        }
      };

      const updateItem = (index, itemFieldName, itemValue) => {
        const newList = [...listValue];
        newList[index] = { ...newList[index], [itemFieldName]: itemValue };
        handleChange(newList);
      };

      const getItemDisplayName = (item, index) => {
        // Try to find a 'name' field or use index
        return item.name || `Item ${index + 1}`;
      };

      const itemLabel = fieldConfig.displayName?.replace(/s$/, "") || "item";

      return (
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={descId}
          data-slot="dynamic-field"
          className="flex min-w-0 flex-col gap-1.5"
        >
          <p id={`${id}-label`} className="text-sm font-medium">
            {fieldConfig.displayName}
          </p>
          {description}

          {listValue.length > 0 && (
            <ul className="divide-y divide-border overflow-hidden rounded-lg ring-1 ring-border ring-inset">
              {listValue.map((item, index) => {
                const open = expandedIndex === index;
                const panelId = `${id}-item-${index}`;
                return (
                  <li key={index}>
                    <div className="flex items-center gap-2 pr-2">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setExpandedIndex(open ? null : index)}
                        className="flex min-h-9 flex-1 items-center gap-2 px-3 text-left text-sm font-medium outline-none transition-[background-color] duration-(--dur-fast) hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        <ChevronRight
                          aria-hidden
                          className={`size-4 text-muted-foreground transition-transform duration-(--dur-fast) ${open ? "rotate-90" : ""}`}
                        />
                        {getItemDisplayName(item, index)}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => removeItem(index)}
                        disabled={disabled}
                      >
                        Remove
                      </Button>
                    </div>

                    {open && (
                      <div
                        id={panelId}
                        className="flex flex-col gap-4 border-t border-border p-3"
                      >
                        {Object.entries(fieldConfig.itemSchema).map(
                          ([itemFieldName, itemFieldConfig]) => (
                            <DynamicFieldRenderer
                              key={itemFieldName}
                              fieldConfig={itemFieldConfig}
                              value={item[itemFieldName]}
                              onChange={(_, newValue) =>
                                updateItem(index, itemFieldName, newValue)
                              }
                              fieldName={itemFieldName}
                              disabled={disabled}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addItem}
              disabled={disabled}
            >
              <Plus aria-hidden />
              Add {itemLabel.toLowerCase()}
            </Button>
            {listValue.length > 0 && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {listValue.length} item{listValue.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
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
