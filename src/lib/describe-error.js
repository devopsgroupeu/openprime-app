/**
 * What the server said about a failed request, "" when it said nothing for
 * the user: a TypeError (no response, or a bug) and authService's "HTTP
 * error! status N" placeholder for a body without a message.
 */
export function serverMessage(error) {
  return (
    error?.data?.error ||
    (error instanceof TypeError || /^HTTP error! status/.test(error?.message)
      ? ""
      : error?.message || "")
  );
}

// The toast text of a failed request: what failed and what to do. `action`
// completes "Couldn't ...", e.g. "save your changes" or "test aws-sandbox".
export function describeError(error, action) {
  // fetch rejects with a TypeError when no response came back (offline, DNS):
  // "Failed to fetch", "NetworkError when attempting to fetch resource." or
  // "Load failed", depending on the browser.
  if (
    error instanceof TypeError &&
    /fetch|network|load failed/i.test(error.message)
  ) {
    return `Couldn't ${action}. Check your connection and try again.`;
  }
  const message = serverMessage(error);
  const errorId = error?.requestId ? ` (Error ID: ${error.requestId})` : "";
  return message
    ? `Couldn't ${action}: ${message}${errorId}`
    : `Couldn't ${action}. Try again.${errorId}`;
}
