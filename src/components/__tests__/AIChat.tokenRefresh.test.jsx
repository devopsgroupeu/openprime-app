// OP-271: the three AI chat components called /ai/chat with a raw fetch and
// whatever token was in memory, so a token that expired in flight surfaced as
// "couldn't connect". They go through the shared client, which refreshes and
// retries once.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import keycloak from "../../config/keycloak";
import AIChatModal from "../modals/AIChatModal";
import AuraChatWindow, { INITIAL_MESSAGES } from "../AuraChatWindow";
import WizardAssistant from "../WizardAssistant";

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

const type = (input) =>
  fireEvent.change(input, { target: { value: "Which node size?" } });

const components = [
  [
    "AIChatModal",
    () => {
      render(<ModalHarness />);
      const input = screen.getByPlaceholderText("Ask about EKS...");
      type(input);
      fireEvent.submit(input.form);
    },
  ],
  [
    "AuraChatWindow",
    () => {
      render(<AuraHarness />);
      const input = screen.getByPlaceholderText(/Ask Aura anything/);
      type(input);
      fireEvent.keyDown(input, { key: "Enter" });
    },
  ],
  [
    "WizardAssistant",
    () => {
      render(
        <WizardAssistant context={{ name: "staging", provider: "aws" }} />,
      );
      type(screen.getByPlaceholderText("Ask Aura…"));
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    },
  ],
];

beforeEach(() => {
  keycloak.token = "stale-token";
  // Locally the token still looks valid; only a forced refresh replaces it.
  keycloak.updateToken = vi.fn(async (minValidity) => {
    if (minValidity !== -1) return false;
    keycloak.token = "fresh-token";
    return true;
  });
  keycloak.logout = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});

  server.use(
    http.post("*/ai/chat", ({ request }) =>
      request.headers.get("Authorization") === "Bearer fresh-token"
        ? new HttpResponse(
            'data: {"chunk":"Fresh answer."}\n\ndata: {"done":true}\n\n',
            { headers: { "Content-Type": "text/event-stream" } },
          )
        : HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
    ),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AI chat token refresh (OP-271)", () => {
  it.each(components)(
    "%s refreshes and retries on a 401 instead of failing",
    async (_name, ask) => {
      ask();

      expect(await screen.findByText(/Fresh answer\./)).toBeInTheDocument();
      expect(keycloak.updateToken).toHaveBeenCalledWith(-1);
      expect(keycloak.logout).not.toHaveBeenCalled();
    },
  );
});
