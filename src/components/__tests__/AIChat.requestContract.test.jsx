// The /ai/chat request each chat component sends, checked against what the
// backend accepts. Every other test mocks /ai/chat with a handler that takes
// any body, so when the backend started rejecting "bot" turns (OP-263) two of
// these components answered every question with an error for six days and no
// test noticed. This mock answers like the backend instead.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import keycloak from "../../config/keycloak";
import AIChatModal from "../modals/AIChatModal";
import AuraChatWindow, { INITIAL_MESSAGES } from "../AuraChatWindow";
import WizardAssistant from "../WizardAssistant";

// Mirrors toTurns() in openprime-app-backend src/services/aiChatRequest.js
// (backend#74). Keep the two in step: a role the backend stops accepting has to
// be removed here too, or this test keeps passing over a broken chat.
const BACKEND_ROLE_ALIASES = { bot: "assistant", ai: "assistant" };

function backendRejection(body) {
  if (!Array.isArray(body?.messages)) return "messages must be an array";
  const turns = [];
  for (const message of body.messages) {
    const role = BACKEND_ROLE_ALIASES[message?.type] ?? message?.type;
    if (role === "system") continue;
    if (role !== "user" && role !== "assistant") {
      return "Only user and assistant messages are accepted";
    }
    const text = message.content ?? message.message;
    if (typeof text !== "string") return "Message content must be a string";
    if (text.trim() === "") continue;
    turns.push(role);
  }
  if (turns.length === 0 || turns.at(-1) !== "user") {
    return "The conversation must end with a user message";
  }
  return null;
}

function ModalHarness() {
  const [messages, setMessages] = useState([]);
  return (
    <AIChatModal
      isOpen
      service="eks"
      serviceTitle="EKS"
      wizardValues={{}}
      messages={messages}
      setMessages={setMessages}
      setNewEnv={() => {}}
      onClose={() => {}}
    />
  );
}

function AuraHarness() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  return (
    <AuraChatWindow
      onClose={() => {}}
      messages={messages}
      setMessages={setMessages}
    />
  );
}

const ask = (input, question, send) => {
  fireEvent.change(input, { target: { value: question } });
  send(input);
};

const components = [
  [
    "AIChatModal",
    () => render(<ModalHarness />),
    () => screen.getByPlaceholderText("Ask about EKS..."),
    (input) => fireEvent.submit(input.form),
  ],
  [
    "AuraChatWindow",
    () => render(<AuraHarness />),
    () => screen.getByPlaceholderText(/Ask Aura anything/),
    (input) => fireEvent.keyDown(input, { key: "Enter" }),
  ],
  [
    "WizardAssistant",
    () =>
      render(
        <WizardAssistant context={{ name: "staging", provider: "aws" }} />,
      ),
    () => screen.getByPlaceholderText("Ask Aura…"),
    () => fireEvent.click(screen.getByRole("button", { name: "Send message" })),
  ],
];

let rejections;
let answered;

beforeEach(() => {
  rejections = [];
  answered = 0;
  keycloak.token = "test-token";
  keycloak.updateToken = vi.fn(async () => false);
  keycloak.logout = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});

  server.use(
    http.post("*/ai/chat", async ({ request }) => {
      const reason = backendRejection(await request.json());
      if (reason) {
        rejections.push(reason);
        return HttpResponse.json({ error: reason }, { status: 400 });
      }
      answered += 1;
      return new HttpResponse(
        `data: {"chunk":"Answer ${answered}."}\n\ndata: {"done":true}\n\n`,
        { headers: { "Content-Type": "text/event-stream" } },
      );
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AI chat request contract (OP-263)", () => {
  it.each(components)(
    "%s gets a first and a follow-up question past the backend's checks",
    async (_name, mount, input, send) => {
      mount();

      ask(input(), "Which node size?", send);
      expect(await screen.findByText(/Answer 1\./)).toBeInTheDocument();

      // The follow-up carries the model's own answer in the history.
      ask(input(), "And for production?", send);
      expect(await screen.findByText(/Answer 2\./)).toBeInTheDocument();

      expect(rejections).toEqual([]);
    },
  );

  it("the mock rejects what the backend rejects", () => {
    expect(
      backendRejection({ messages: [{ type: "model", message: "x" }] }),
    ).toBe("Only user and assistant messages are accepted");
    expect(
      backendRejection({ messages: [{ type: "user", message: "hi" }] }),
    ).toBeNull();
  });
});
