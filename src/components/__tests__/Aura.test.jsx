// Aura's conversation behaviour on its surfaces: the floating window of the
// app shell, the wizard panel and the service dialog.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import keycloak from "../../config/keycloak";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import AuraChatButton from "../AuraChatButton";
import AIChatModal from "../modals/AIChatModal";
import { AURA_ERROR } from "../modals/ai-chat/AuraConversation";
import { STALL_MS } from "../modals/ai-chat/streamChat";
import { SERVICES_CONFIG } from "../../config/servicesConfig";
import WizardAssistant from "../WizardAssistant";

// The wizard owns the messages, as WizardPage does.
function WizardHarness() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  return (
    <WizardAssistant
      context={{ name: "staging", provider: "aws" }}
      messages={messages}
      setMessages={setMessages}
      draft={draft}
      setDraft={setDraft}
    />
  );
}

function ModalHarness({ onClose = () => {}, service = "eks" }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  return (
    <AIChatModal
      isOpen
      service={service}
      serviceTitle="EKS"
      wizardValues={{ name: "staging" }}
      messages={messages}
      setMessages={setMessages}
      draft={draft}
      setDraft={setDraft}
      setNewEnv={() => {}}
      onClose={onClose}
    />
  );
}

const encoder = new TextEncoder();
const event = (data) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
const answer = (text) =>
  new HttpResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(event({ chunk: text }));
        controller.enqueue(event({ done: true }));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
// Sends `chunks`, then stays open: a model that stopped answering.
const hang = (chunks = []) =>
  new HttpResponse(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(event({ chunk })));
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );

let requests;
// What /ai/chat answers to request n (1-based); default: "Answer n."
let reply;

beforeEach(() => {
  requests = [];
  reply = (n) => answer(`Answer ${n}.`);
  keycloak.token = "test-token";
  keycloak.updateToken = vi.fn(async () => false);
  vi.spyOn(console, "error").mockImplementation(() => {});
  server.use(
    http.post("*/ai/chat", async ({ request }) => {
      requests.push(await request.json());
      return reply(requests.length);
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.innerWidth = 1024;
});

const composer = () => screen.getByRole("textbox", { name: /Message Aura/ });
const type = (text) =>
  fireEvent.change(composer(), { target: { value: text } });
// Messages, without the status line that repeats a failure.
const thread = () => within(document.querySelector("[data-slot=chat-thread]"));
const ask = (text) => {
  type(text);
  fireEvent.keyDown(composer(), { key: "Enter" });
};

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

  it("fills the composer from a suggested question without sending", async () => {
    render(<WizardHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Which region for EU customers?" }),
    );
    expect(composer()).toHaveValue("Which region for EU customers?");
    expect(composer()).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toHaveLength(0);
  });

  it("shows Thinking and sends nothing else while Aura answers", async () => {
    reply = () => hang();
    render(<WizardHarness />);
    ask("Which node size?");

    expect(await screen.findByText("Thinking")).toBeInTheDocument();
    ask("And for production?");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(requests).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
    // The second question stays in the composer for later.
    expect(composer()).toHaveValue("And for production?");
  });
});

describe("Aura answers that do not finish", () => {
  it("stops an answer, keeps what came and asks again on Try again", async () => {
    reply = (n) => (n === 1 ? hang(["Use m5.large"]) : answer("Use m6i."));
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Use m5.large")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(
      await thread().findByText("You stopped this answer."),
    ).toBeInTheDocument();
    expect(screen.getByText("Use m5.large")).toBeInTheDocument();
    expect(composer()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Use m6i.")).toBeInTheDocument();
    expect(screen.queryByText("Use m5.large")).toBeNull();
    expect(screen.queryByText("You stopped this answer.")).toBeNull();
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual(requests[0]);
  });

  it("stops a question the server has not answered at all", async () => {
    // No response, not even headers: only aborting the fetch ends it.
    reply = () => new Promise(() => {});
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Thinking")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(
      await thread().findByText("You stopped this answer."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Thinking")).toBeNull();
  });

  it("gives up on an answer that sends nothing for a minute", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    reply = (n) => (n === 1 ? hang(["Use m5"]) : answer("Use m6i."));
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(STALL_MS);
    });
    expect(
      await thread().findByText("Aura took too long to answer."),
    ).toBeInTheDocument();
    expect(screen.getByText("Use m5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Use m6i.")).toBeInTheDocument();
    expect(requests[1]).toEqual(requests[0]);
  });

  it("asks a failed question again with the same history", async () => {
    reply = (n) =>
      n === 2
        ? HttpResponse.json({ error: "x" }, { status: 500 })
        : answer(`Answer ${n}.`);
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Answer 1.")).toBeInTheDocument();
    ask("And for production?");
    expect(await thread().findByText(/couldn't answer/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Answer 3.")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't answer/)).toBeNull();
    expect(requests[2]).toEqual(requests[1]);
  });

  it("stops and retries in the service dialog too", async () => {
    reply = (n) => (n === 1 ? hang(["Use Karpenter"]) : answer("Use m6i."));
    render(<ModalHarness />);
    type("Which node size?");
    fireEvent.submit(composer().form);
    expect(await screen.findByText("Use Karpenter")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(
      await thread().findByText("You stopped this answer."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Use m6i.")).toBeInTheDocument();
    expect(requests[1]).toEqual(requests[0]);
  });
});

describe("Aura for screen readers", () => {
  it("announces a finished answer, not the streaming thread", async () => {
    const { container } = render(<WizardHarness />);
    ask("Which node size?");
    await screen.findByText("Answer 1.");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Aura answered: Answer 1.",
      ),
    );
    expect(screen.getByRole("status")).toHaveClass("sr-only");
    const thread = container.querySelector("[data-slot=chat-thread]");
    expect(thread).not.toHaveAttribute("aria-live");
  });

  it("announces why an answer failed", async () => {
    reply = () => HttpResponse.json({ error: "x" }, { status: 500 });
    render(<WizardHarness />);
    ask("Which node size?");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Aura couldn't answer right now.",
      ),
    );
  });
});

// The app shell's floating Aura next to a page with its own button.
function Shell() {
  return (
    <ToastProvider>
      <TooltipProvider>
        <button type="button">Page action</button>
        <AuraChatButton />
      </TooltipProvider>
    </ToastProvider>
  );
}
const launcher = () => screen.getByRole("button", { name: "Ask Aura" });
const auraWindow = () => screen.queryByRole("dialog", { name: "Aura" });

describe("Aura window", () => {
  it("is modal when it fills a phone screen", async () => {
    window.innerWidth = 390;
    render(<Shell />);
    fireEvent.click(launcher());

    expect(auraWindow()).toBeInTheDocument();
    // Everything behind it is out of reach.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Page action" })).toBeNull(),
    );
    expect(composer()).toHaveFocus();
  });

  it("floats beside the page from sm up", () => {
    render(<Shell />);
    fireEvent.click(launcher());

    expect(composer()).toHaveFocus();
    const page = screen.getByRole("button", { name: "Page action" });
    fireEvent.pointerDown(page);
    page.focus();
    fireEvent.keyDown(page, { key: "Escape" });
    // The page stays usable and Aura stays open.
    expect(auraWindow()).toBeInTheDocument();
  });

  it("keeps what was typed when it closes", async () => {
    render(<Shell />);
    fireEvent.click(launcher());
    type("Which region for EU customers?");

    fireEvent.keyDown(composer(), { key: "Escape" });
    await waitFor(() => expect(auraWindow()).toBeNull());
    fireEvent.click(launcher());
    expect(composer()).toHaveValue("Which region for EU customers?");
  });

  it("can stop an answer after closing and reopening the window", async () => {
    reply = () => hang(["Use m5"]);
    render(<Shell />);
    fireEvent.click(launcher());
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Aura" }));
    await waitFor(() => expect(auraWindow()).toBeNull());
    fireEvent.click(launcher());
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(
      await thread().findByText("You stopped this answer."),
    ).toBeInTheDocument();
  });

  it("has one close button while open", () => {
    render(<Shell />);
    fireEvent.click(launcher());

    expect(screen.getAllByRole("button", { name: /Close Aura/ })).toHaveLength(
      1,
    );
    expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
  });

  it("closes one level per Escape and gives focus back to the launcher", async () => {
    reply = () => answer("Run:\n```bash\nls\n```");
    render(<Shell />);
    fireEvent.click(launcher());
    ask("How do I list files?");
    const copy = await screen.findByRole("button", { name: "Copy code" });

    act(() => copy.focus());
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    fireEvent.keyDown(copy, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    expect(auraWindow()).toBeInTheDocument();

    // Escape while an IME composes only cancels the composition.
    fireEvent.keyDown(copy, { key: "Escape", isComposing: true });
    expect(auraWindow()).toBeInTheDocument();

    fireEvent.keyDown(copy, { key: "Escape" });
    await waitFor(() => expect(auraWindow()).toBeNull());
    await waitFor(() => expect(launcher()).toHaveFocus());
  });
});

describe("Aura service dialog", () => {
  // A catalog entry the request cannot be built from fails like a request.
  it("shows a failed answer when the question cannot be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    SERVICES_CONFIG.nofields = { displayName: "No fields" };
    try {
      render(<ModalHarness service="nofields" />);
      type("Which node size?");
      fireEvent.submit(composer().form);

      expect(await thread().findByText(AURA_ERROR)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
      expect(requests).toHaveLength(0);
    } finally {
      delete SERVICES_CONFIG.nofields;
    }
  });

  it("lets Escape end an IME composition without closing", () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    fireEvent.keyDown(composer(), { key: "Escape", isComposing: true });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(composer(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
