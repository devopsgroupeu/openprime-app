import { render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/contexts/ToastContext";
import MessageContent from "../MessageContent";

const renderContent = (content) =>
  render(
    <ToastProvider>
      <TooltipProvider>
        <MessageContent content={content} />
      </TooltipProvider>
    </ToastProvider>,
  );

describe("MessageContent", () => {
  it.each(["c++", "shell-session", "objective-c"])(
    "draws a ```%s block as code under its language",
    (lang) => {
      const { container } = renderContent(
        `Run this:\n\`\`\`${lang}\nmake all\n\`\`\`\nDone.`,
      );
      const block = container.querySelector("[data-slot=code-block]");
      expect(block).not.toBeNull();
      expect(block).toHaveTextContent(lang);
      expect(block.querySelector("code")).toHaveTextContent("make all");
      expect(screen.queryByText(/```/)).toBeNull();
    },
  );
});
