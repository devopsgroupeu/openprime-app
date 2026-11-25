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

  // A failed handler ends the answer: the stream is closed, not left open.
  it("closes the stream when its event handler fails", async () => {
    const cancel = vi.spyOn(ReadableStreamDefaultReader.prototype, "cancel");
    reply = () => stream([{ chunk: "Use m5" }]);
    const { finished } = streamChat({}, () => {
      throw new Error("handler failed");
    });

    await expect(finished).rejects.toThrow("handler failed");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  // The backend sends a whole answer as one large event, which the network
  // can deliver in pieces; the last event may lack its line break.
  it("reads an event split across two reads, and a last line without a break", async () => {
    const answer = "Use m5 for the caf\u00e9 staging";
    const text = `data: ${JSON.stringify({ chunk: answer })}\n\n`;
    const bytes = encoder.encode(text);
    // Inside the two bytes of the accented letter.
    const cut =
      encoder.encode(text.slice(0, text.indexOf("\u00e9"))).length + 1;
    reply = () =>
      new HttpResponse(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(bytes.slice(0, cut));
            await new Promise((resolve) => setTimeout(resolve, 10));
            controller.enqueue(bytes.slice(cut));
            controller.enqueue(encoder.encode('data: {"done":true}'));
            controller.close();
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    const events = [];

    await expect(
      streamChat({}, (data) => events.push(data)).finished,
    ).resolves.toBe("done");
    expect(events).toEqual([{ chunk: answer }, { done: true }]);
  });
});
