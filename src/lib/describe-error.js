// The toast text of a failed request: what failed and what to do. `action`
// completes "Couldn't ...", e.g. "save your changes" or "test aws-sandbox".
export function describeError(error, action) {
  // fetch rejects with a TypeError when no response came back (offline, DNS).
  if (error instanceof TypeError) {
    return `Couldn't ${action}. Check your connection and try again.`;
  }
  const message = error?.data?.error || error?.message;
  const errorId = error?.requestId ? ` (Error ID: ${error.requestId})` : "";
  return message
    ? `Couldn't ${action}: ${message}${errorId}`
    : `Couldn't ${action}. Try again.${errorId}`;
}
