import authService from "../../../services/authService";

// An answer that sends nothing for this long is given up on. The first chunk
// gets longer: the backend sends nothing while it retries a throttled model
// or falls back to a non-streaming answer.
export const STALL_MS = 60_000;
export const FIRST_CHUNK_MS = 120_000;

/**
 * POST /ai/chat with `body` and read its event stream, passing each `data:`
 * event to `onEvent`. Returns `stop()` and `finished`, which resolves with how
 * the answer ended: "done", "stopped" (stop() was called) or "timeout" (no
 * first chunk for FIRST_CHUNK_MS, then none for STALL_MS), and rejects when
 * the request or `onEvent` fails. Ending early closes the connection, so the
 * backend stops the model too.
 */
export function streamChat(body, onEvent) {
  const controller = new AbortController();
  let reader = null;
  let stall;
  const watch = (ms) => {
    clearTimeout(stall);
    stall = setTimeout(() => controller.abort("timeout"), ms);
  };
  // Ends a read that is waiting for the next chunk.
  controller.signal.addEventListener("abort", () => {
    reader?.cancel().catch(() => {});
  });

  const finished = (async () => {
    watch(FIRST_CHUNK_MS);
    try {
      const res = await authService.makeAuthenticatedRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Aura is unavailable");

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        watch(STALL_MS);
        for (const line of decoder
          .decode(value, { stream: true })
          .split("\n")) {
          if (!line.startsWith("data: ")) continue;
          let data;
          try {
            data = JSON.parse(line.replace(/^data: /, ""));
          } catch {
            continue; // a malformed line
          }
          // Outside the try: a failing handler fails the answer.
          onEvent(data);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) throw err;
    } finally {
      clearTimeout(stall);
    }
    return controller.signal.aborted ? controller.signal.reason : "done";
  })();

  return { stop: () => controller.abort("stopped"), finished };
}
