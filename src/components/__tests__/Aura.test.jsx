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
import { extractSuggestionsFromText } from "../modals/ai-chat/suggestions";
import aiSymbol from "@/assets/openprime-ai-symbol-color.svg";
import aiSymbolAnimated from "@/assets/openprime-ai-symbol-color-animated.svg";

// The real suggestion reader; a test can make it fail once.
vi.mock("../modals/ai-chat/suggestions", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    extractSuggestionsFromText: vi.fn(actual.extractSuggestionsFromText),
  };
});

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

  // In a browser the click's default action runs after React re-rendered
  // the stopped answer: Stop must cancel it and must not turn into the Send
  // button, which would submit the follow-up.
  it.each([
    ["wizard panel", WizardHarness],
    ["service dialog", ModalHarness],
  ])("never sends the typed follow-up on Stop (%s)", async (_, Harness) => {
    reply = () => hang(["Use m5"]);
    render(<Harness />);
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();
    type("And for prod");
    const stop = screen.getByRole("button", { name: "Stop" });

    // fireEvent returns false when a listener cancelled the default action.
    expect(fireEvent.click(stop)).toBe(false);
    expect(
      await thread().findByText("You stopped this answer."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).not.toBe(stop);
    expect(requests).toHaveLength(1);
    expect(composer()).toHaveValue("And for prod");
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
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
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
    // Stopping is not a failure.
    expect(logged).not.toHaveBeenCalled();
  });

  // Stop goes when the answer ends; focus on it must not fall to the page.
  it("moves focus to the composer when an answer ends while Stop has it", async () => {
    let finish;
    reply = () =>
      new HttpResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(event({ chunk: "Use m5" }));
            finish = () => {
              controller.enqueue(event({ done: true }));
              controller.close();
            };
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Stop" }).focus());

    act(() => finish());
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Stop" })).toBeNull(),
    );
    expect(composer()).toHaveFocus();
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
    vi.spyOn(console, "error").mockImplementation(() => {});
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
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry).toHaveAttribute("data-variant", "secondary");
    act(() => retry.focus());
    fireEvent.click(retry);
    // Try again goes with its turn: the composer keeps the focus.
    expect(composer()).toHaveFocus();
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

  // Read aloud, a fence and its code are noise; the prose around it is not.
  it("leaves code blocks out of the announcement", async () => {
    reply = () => answer("Run:\n```bash\nls -la\n```\nThen check the size.");
    render(
      // A code block has a Copy button (tooltip, toast).
      <ToastProvider>
        <TooltipProvider>
          <WizardHarness />
        </TooltipProvider>
      </ToastProvider>,
    );
    ask("How do I list files?");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Aura answered: Run: Then check the size.",
      ),
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(/```|ls -la/);
  });

  it("announces a stopped answer and one that took too long", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    reply = () => hang(["Use m5"]);
    render(<WizardHarness />);
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "You stopped this answer.",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Use m5")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(STALL_MS);
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Aura took too long to answer.",
      ),
    );
  });

  it("announces why an answer failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
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

  it("closes on Escape on a phone and gives focus back to the launcher", async () => {
    window.innerWidth = 390;
    render(<Shell />);
    fireEvent.click(launcher());
    expect(composer()).toHaveFocus();

    fireEvent.keyDown(composer(), { key: "Escape" });
    await waitFor(() => expect(auraWindow()).toBeNull());
    await waitFor(() => expect(launcher()).toHaveFocus());
    expect(screen.getByRole("button", { name: "Page action" })).toBeVisible();
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

  // Try again removes itself with its turn. Focus stays in the window, so
  // Escape (which only closes from inside it) still closes it.
  it("keeps focus in the composer after Try again, and Escape closes", async () => {
    reply = (n) => (n === 1 ? hang(["Use m5"]) : answer("Use m6i."));
    render(<Shell />);
    fireEvent.click(launcher());
    ask("Which node size?");
    expect(await screen.findByText("Use m5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    const retry = await screen.findByRole("button", { name: "Try again" });

    act(() => retry.focus());
    fireEvent.click(retry);
    expect(composer()).toHaveFocus();
    expect(await screen.findByText("Use m6i.")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    await waitFor(() => expect(auraWindow()).toBeNull());
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
      // No answer was in flight, and the failure is still announced.
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(AURA_ERROR),
      );
    } finally {
      delete SERVICES_CONFIG.nofields;
    }
  });

  // Reading the suggestions of a whole answer can fail: the answer shows as
  // a normal, complete one and the failure is only logged.
  it("shows a whole answer normally when reading its suggestions fails", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = new Error("bad suggestion");
    extractSuggestionsFromText.mockImplementationOnce(() => {
      throw failure;
    });
    reply = () => answer('Use this:\n```json\n{"nodeSize": "m5.large"}\n```');
    // The code block's copy button needs the app's toasts and tooltips.
    render(
      <ToastProvider>
        <TooltipProvider>
          <ModalHarness />
        </TooltipProvider>
      </ToastProvider>,
    );
    type("Which node size?");
    fireEvent.submit(composer().form);

    const block = await waitFor(() => {
      const found = document.querySelector("[data-slot=code-block]");
      expect(found).not.toBeNull();
      return found;
    });
    expect(block).toHaveTextContent("m5.large");
    expect(thread().getByText(/Use this:/)).toBeInTheDocument();
    expect(document.querySelector("[data-slot=marker]")).toBeNull();
    expect(thread().queryByText(AURA_ERROR)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(logged).toHaveBeenCalledWith(failure);
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

// Aura carries the OpenPrime AI symbol (spec 38): the static mark, and the
// brand's animated one while it answers (the static one with reduced motion).
const marks = (el = document.body) => [
  ...el.querySelectorAll('[data-slot="aura-mark"]'),
];
const isStaticMark = (img) => img.getAttribute("src") === aiSymbol;
const isThinkingMark = (img) => {
  const source = img.parentElement.querySelector("source");
  return (
    img.getAttribute("src") === aiSymbolAnimated &&
    img.parentElement.tagName === "PICTURE" &&
    source.getAttribute("media") === "(prefers-reduced-motion: reduce)" &&
    source.getAttribute("srcset") === aiSymbol
  );
};

describe("Aura mark", () => {
  it("is the launcher's icon and heads the window", () => {
    render(<Shell />);
    const [icon] = marks(launcher());
    expect(isStaticMark(icon)).toBe(true);
    expect(icon).toHaveAttribute("aria-hidden");
    expect(icon).toHaveAttribute("alt", "");

    fireEvent.click(launcher());
    expect(marks(auraWindow()).filter(isStaticMark)).toHaveLength(1);
  });

  it("heads the wizard panel and the service dialog", () => {
    const { unmount } = render(<WizardHarness />);
    expect(marks().filter(isStaticMark)).toHaveLength(1);
    unmount();

    render(<ModalHarness />);
    const header = screen
      .getByRole("dialog", { name: "Ask Aura about EKS" })
      .querySelector('[data-slot="dialog-header"]');
    expect(marks(header).filter(isStaticMark)).toHaveLength(1);
  });

  it("plays while Aura answers and rests once the answer is in", async () => {
    let finish;
    reply = () =>
      new HttpResponse(
        new ReadableStream({
          start(controller) {
            finish = () => {
              controller.enqueue(event({ chunk: "Use m6i." }));
              controller.enqueue(event({ done: true }));
              controller.close();
            };
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    render(<WizardHarness />);
    ask("Which node size?");

    expect(await screen.findByText("Thinking")).toBeInTheDocument();
    const turn = () => thread().getByText("Aura").closest("article");
    const [playing] = marks(turn());
    expect(isThinkingMark(playing)).toBe(true);

    act(() => finish());
    expect(await screen.findByText("Use m6i.")).toBeInTheDocument();
    await waitFor(() => expect(isStaticMark(marks(turn())[0])).toBe(true));
    expect(document.querySelector("picture")).toBeNull();
  });
});
