import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import keycloak from "../../../../config/keycloak";
import { FIRST_CHUNK_MS, STALL_MS, streamChat } from "../streamChat";

const encoder = new TextEncoder();
const event = (data) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
// Sends `chunks`, then stays open.
const stream = (chunks, { close = false } = {}) =>
  new HttpResponse(
    new ReadableStream({
      start(controller) {
        chunks.forEach((data) => controller.enqueue(event(data)));
        if (close) controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );

let reply;
beforeEach(() => {
  keycloak.token = "test-token";
  keycloak.updateToken = vi.fn(async () => false);
  server.use(http.post("*/ai/chat", () => reply()));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("streamChat", () => {
  // The backend sends nothing while it retries a throttled model or falls
  // back to a non-streaming answer, so the first chunk may take longer.
  it("waits longer for the first chunk than between chunks", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    reply = () => stream([]);
    let end;
    streamChat({}, () => {}).finished.then((how) => (end = how));

    await vi.advanceTimersByTimeAsync(STALL_MS);
    expect(end).toBeUndefined();
    await vi.advanceTimersByTimeAsync(FIRST_CHUNK_MS - STALL_MS);
    await waitFor(() => expect(end).toBe("timeout"));
  });

  it("gives up a minute after the last chunk", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    reply = () => stream([{ chunk: "Use m5" }]);
    const chunks = [];
    let end;
    streamChat({}, (data) => chunks.push(data.chunk)).finished.then(
      (how) => (end = how),
    );
    await waitFor(() => expect(chunks).toEqual(["Use m5"]));

    await vi.advanceTimersByTimeAsync(STALL_MS);
    await waitFor(() => expect(end).toBe("timeout"));
  });

  // Only a line that is not JSON is skipped; a failing handler is a failure.
  it("skips a malformed line but not an error of its event handler", async () => {
    reply = () =>
      new HttpResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("data: {not json\n\n"));
            controller.enqueue(event({ chunk: "Use m5" }));
            controller.close();
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    const { finished } = streamChat({}, () => {
      throw new Error("handler failed");
    });

    await expect(finished).rejects.toThrow("handler failed");
  });
});
