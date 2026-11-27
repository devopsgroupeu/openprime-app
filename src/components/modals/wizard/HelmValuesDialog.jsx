// The custom values of one Helm chart: a YAML editor that checks the text
// before it saves.
import { useEffect, useId, useRef, useState } from "react";
import { getHelmChartConfig } from "../../../config/helmChartsConfig";
import { chartLogo } from "../../../config/logos";
import { LogoTile } from "@/components/shared/logo-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

// Well under the backend's 1 MB body limit for a whole environment.
const MAX_BYTES = 64 * 1024;

const PLACEHOLDER = "replicaCount: 2\nresources:\n  requests:\n    cpu: 100m";

// Saved without leading blank lines and trailing space; the first line keeps
// its indent, which a uniformly indented mapping needs.
const tidy = (text) => text.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();

// Why the text cannot be saved (`at`: its offset, when known), or null.
// Checked as typed, so the line matches the editor; tidying changes neither
// whether it parses nor what it holds.
const problemOf = async (text) => {
  const bytes = new TextEncoder().encode(tidy(text)).length;
  if (bytes > MAX_BYTES) {
    const size = Math.ceil(bytes / 1024);
    return { message: `Values can be up to 64 KB. These are ${size} KB.` };
  }
  // Loaded on the first save, not with the app.
  const { isMap, parseDocument } = await import("yaml");
  const doc = parseDocument(text);
  const [error] = doc.errors;
  if (error) {
    const what =
      error.code === "MULTIPLE_DOCS"
        ? "Keep the values in one document, without a --- line"
        : error.message.split(" at line ")[0].replace(/\.$/, "");
    const line = error.linePos?.[0]?.line;
    return {
      message: line ? `Line ${line}: ${what}.` : `${what}.`,
      at: error.pos?.[0],
    };
  }
  if (!isMap(doc.contents)) {
    return {
      message: "Values must be a mapping of keys, such as replicaCount: 2.",
    };
  }
  return null;
};

function ValuesEditor({ chartKey, chart, open, values, onSave, onClose }) {
  const id = useId();
  const editor = useRef(null);
  const [text, setText] = useState(values);
  // `invalid`: the text is wrong (not set when the check could not run).
  const [problem, setProblem] = useState(null);
  const [checking, setChecking] = useState(false);
  // False once the dialog closes: a check that ends later is dropped.
  const live = useRef(true);
  useEffect(() => {
    live.current = open;
    return () => {
      live.current = false;
    };
  }, [open]);

  const showProblem = ({ message, at, invalid = true }) => {
    setProblem({ message, invalid });
    editor.current.focus();
    if (at !== undefined) editor.current.setSelectionRange(at, at);
  };

  const save = async (event) => {
    event.preventDefault();
    // Untouched: no edit to record (Loki's default flag, values another
    // client stored with a trailing newline, stay as they are).
    if (tidy(text) === tidy(values)) return onClose();
    if (tidy(text)) {
      setChecking(true);
      let found;
      try {
        found = await problemOf(text);
      } catch {
        // The parser's chunk did not load (replaced by a deploy, offline).
        found = {
          message: "Could not check the values. Reload the page and try again.",
          invalid: false,
        };
      } finally {
        setChecking(false);
      }
      if (!live.current) return;
      if (found) return showProblem(found);
    }
    onSave(tidy(text));
    onClose();
  };

  // Empties the editor; Save removes the values, Cancel keeps them.
  const clear = () => {
    setText("");
    setProblem(null);
    editor.current.focus();
  };

  return (
    <>
      {/* min-w-0: the nowrap chart id must not widen the dialog's grid. */}
      <DialogHeader className="min-w-0 gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LogoTile {...chartLogo(chartKey)} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle>{chart.displayName}</DialogTitle>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {`${chart.repository}/${chart.chart}`}
            </p>
          </div>
        </div>
        <DialogDescription>
          These values are saved with the environment, but generated
          repositories do not apply them yet.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={save} className="grid min-w-0 gap-4">
        <Field className="min-w-0">
          <FieldLabel htmlFor={`${id}-values`}>Values</FieldLabel>
          <Textarea
            ref={editor}
            id={`${id}-values`}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setProblem(null);
            }}
            placeholder={PLACEHOLDER}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-invalid={problem?.invalid ? true : undefined}
            aria-describedby={problem ? `${id}-error` : `${id}-help`}
            className="h-72 resize-y overflow-auto font-mono leading-5 whitespace-pre field-sizing-fixed md:text-xs"
          />
          {problem ? (
            <FieldError id={`${id}-error`}>{problem.message}</FieldError>
          ) : (
            <FieldDescription id={`${id}-help`}>
              YAML, as in the chart&apos;s values.yaml. Up to 64 KB.
            </FieldDescription>
          )}
        </Field>

        <DialogFooter>
          {values ? (
            <Button
              type="button"
              variant="ghost"
              className="sm:mr-auto"
              disabled={!text}
              onClick={clear}
            >
              Clear values
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={checking}>
            {checking ? <Spinner aria-hidden /> : null}
            Save values
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/**
 * `values`: the chart's saved text; `onSave(text)` gets the new text, "" to
 * remove it. The editor starts afresh on every open: Cancel, Escape and the
 * close button discard what was typed.
 */
const HelmValuesDialog = ({ chartKey, open, onOpenChange, values, onSave }) => {
  const chart = getHelmChartConfig(chartKey);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {chart ? (
          <ValuesEditor
            chartKey={chartKey}
            chart={chart}
            open={open}
            values={values}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default HelmValuesDialog;
