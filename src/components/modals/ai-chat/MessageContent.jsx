import { CodeBlock } from "@/components/shared/code-block";

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
