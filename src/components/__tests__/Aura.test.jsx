// Aura's conversation behaviour on its surfaces: the floating window of the
// app shell, the wizard panel and the service dialog.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import keycloak from "../../config/keycloak";
import WizardAssistant from "../WizardAssistant";

// The wizard owns the messages, as WizardPage does.
function WizardHarness() {
  const [messages, setMessages] = useState([]);
  return (
    <WizardAssistant
      context={{ name: "staging", provider: "aws" }}
      messages={messages}
      setMessages={setMessages}
    />
  );
}

let requests;

beforeEach(() => {
  requests = [];
  keycloak.token = "test-token";
  keycloak.updateToken = vi.fn(async () => false);
  vi.spyOn(console, "error").mockImplementation(() => {});
  server.use(
    http.post("*/ai/chat", async ({ request }) => {
      requests.push(await request.json());
      return new HttpResponse(
        `data: {"chunk":"Answer ${requests.length}."}\n\ndata: {"done":true}\n\n`,
        { headers: { "Content-Type": "text/event-stream" } },
      );
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

const composer = () => screen.getByRole("textbox", { name: "Message Aura" });
const type = (text) =>
  fireEvent.change(composer(), { target: { value: text } });

describe("Aura composer", () => {
  it("does not send the Enter that ends an IME composition", async () => {
    render(<WizardHarness />);
    type("ノードのサイズ");

    // Chrome and Firefox flag the event; Safari sends keyCode 229 instead.
    fireEvent.keyDown(composer(), { key: "Enter", isComposing: true });
    fireEvent.keyDown(composer(), { key: "Enter", keyCode: 229 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toHaveLength(0);
    expect(composer()).toHaveValue("ノードのサイズ");

    fireEvent.keyDown(composer(), { key: "Enter" });
    expect(await screen.findByText("Answer 1.")).toBeInTheDocument();
    expect(requests).toHaveLength(1);
  });
});
