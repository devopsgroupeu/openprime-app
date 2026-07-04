// Renders AI message text, pretty-printing any ```json code blocks it contains.
// Extracted verbatim from AIChatModal's formatMessageContent helper.
const MessageContent = ({ content }) => {
  const jsonCodeBlockRegex = /```json\n([\s\S]*?)\n```/g;

  if (!jsonCodeBlockRegex.test(content)) {
    // No JSON code blocks, return as is
    return <span>{content}</span>;
  }

  // Split content by JSON code blocks and format them
  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  jsonCodeBlockRegex.lastIndex = 0;

  while ((match = jsonCodeBlockRegex.exec(content)) !== null) {
    // Add text before the JSON block
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </span>,
      );
    }

    // Add formatted JSON block
    try {
      const jsonText = match[1].trim();
      const parsedJson = JSON.parse(jsonText);
      const formattedJson = JSON.stringify(parsedJson, null, 2);

      parts.push(
        <div
          key={`json-${match.index}`}
          className="my-3 rounded-lg border bg-surface border-border"
        >
          <div className="section-label px-3 py-1 border-b bg-background border-border">
            JSON Configuration
          </div>
          <pre className="p-3 text-sm overflow-x-auto text-secondary">
            <code>{formattedJson}</code>
          </pre>
        </div>,
      );
    } catch {
      // If JSON parsing fails, show as regular code block
      parts.push(
        <div
          key={`code-${match.index}`}
          className="my-3 rounded-lg border bg-surface border-border"
        >
          <div className="section-label px-3 py-1 border-b bg-background border-border">
            Code
          </div>
          <pre className="p-3 text-sm overflow-x-auto text-secondary">
            <code>{match[1]}</code>
          </pre>
        </div>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last JSON block
  if (lastIndex < content.length) {
    parts.push(<span key={`text-final`}>{content.substring(lastIndex)}</span>);
  }

  return <div>{parts}</div>;
};

export default MessageContent;
