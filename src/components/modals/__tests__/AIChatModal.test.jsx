import { render, screen } from "@testing-library/react";
import { useState } from "react";
import AIChatModal from "../AIChatModal";

// Stateful harness: messages are owned by the parent (the wizard), so the
// welcome-message effect needs a real state owner to render into.
function Harness(props) {
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
      {...props}
    />
  );
}

describe("AIChatModal", () => {
  it("renders nothing when closed", () => {
    render(<Harness isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the modal shell (header + input) when open", () => {
    render(<Harness />);
    expect(
      screen.getByRole("dialog", { name: /AI assistant/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ask AI about EKS")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask about EKS...")).toBeInTheDocument();
  });

  it("shows the AI welcome message on open", async () => {
    render(<Harness />);
    expect(
      await screen.findByText(/here to help you with/i),
    ).toBeInTheDocument();
  });
});
