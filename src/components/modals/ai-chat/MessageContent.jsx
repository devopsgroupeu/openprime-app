import { CopyButton } from "@/components/shared/copy-button";

// Assistant text with its fenced code blocks drawn as mono blocks with a copy
// button; a ```json block is pretty-printed when it parses. The language tag
// is any run without spaces or backticks (c++, shell-session).
const FENCE = /```([^\s`]*)\n([\s\S]*?)\n```/g;

const pretty = (lang, code) => {
  if (lang !== "json") return code;
  try {
    return JSON.stringify(JSON.parse(code.trim()), null, 2);
  } catch {
    return code;
  }
};

function CodeBlock({ lang, code }) {
  return (
    <div
      data-slot="code-block"
      className="my-3 overflow-hidden rounded-lg border bg-muted/40 first:mt-0 last:mb-0"
    >
      <div className="flex h-8 items-center justify-between border-b pr-1 pl-3 text-xs text-muted-foreground">
        <span className="font-mono">{lang || "code"}</span>
        <CopyButton text={code} label="Copy code" size="icon-xs" />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const MessageContent = ({ content }) => {
  const parts = [];
  let lastIndex = 0;
  for (const match of content.matchAll(FENCE)) {
    // The block has its own margin: drop the blank lines around it.
    const text = content.slice(lastIndex, match.index).trim();
    if (text) parts.push(<span key={`text-${lastIndex}`}>{text}</span>);
    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        lang={match[1]}
        code={pretty(match[1], match[2])}
      />,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex === 0) return content;
  const rest = content.slice(lastIndex).trim();
  if (rest) parts.push(<span key="text-final">{rest}</span>);
  return parts;
};

export default MessageContent;
