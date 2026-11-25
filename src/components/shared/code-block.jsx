import { CopyButton } from "@/components/shared/copy-button";

/** Mono code under a bar with its language and a copy button. */
export function CodeBlock({ lang, code, copyLabel = "Copy code" }) {
  return (
    <div
      data-slot="code-block"
      className="my-3 overflow-hidden rounded-lg border bg-muted/40 first:mt-0 last:mb-0"
    >
      <div className="flex h-8 items-center justify-between border-b pr-1 pl-3 text-xs text-muted-foreground">
        <span className="font-mono">{lang || "code"}</span>
        <CopyButton text={code} label={copyLabel} size="icon-xs" />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
