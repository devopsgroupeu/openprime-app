import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "../../contexts/ToastContext";
import EnvironmentConfiguration from "../../components/environment-detail/EnvironmentConfiguration";
import ChatMessage from "../../components/modals/ai-chat/ChatMessage";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { environments } from "../../mocks/fixtures";

// Red text on a red tint is below AA (tokens-contrast.test.js measures the
// tints with a foreground label), so these labels must not turn red again.
const classes = (el) => el.className.split(/\s+/);

describe("labels on destructive tints", () => {
  it("the error pill keeps a foreground label", () => {
    render(<Badge variant="error">Failed</Badge>);
    const pill = classes(screen.getByText("Failed"));
    expect(pill).toContain("bg-destructive/10");
    expect(pill).toContain("text-foreground");
    expect(pill).not.toContain("text-destructive");
  });

  it("a focused destructive menu item keeps a foreground label", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>More</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = classes(screen.getByRole("menuitem", { name: "Delete" }));
    expect(item).toContain(
      "data-[variant=destructive]:focus:bg-destructive/10",
    );
    expect(item).toContain(
      "dark:data-[variant=destructive]:focus:bg-destructive/20",
    );
    expect(item).toContain("data-[variant=destructive]:focus:text-foreground");
    expect(item).not.toContain(
      "data-[variant=destructive]:focus:text-destructive",
    );
  });

  it("the Aura error marker keeps a foreground label", () => {
    render(
      <ChatMessage
        message={{ type: "ai", message: "Aura is unavailable.", error: true }}
      />,
    );
    const marker = classes(
      screen.getByText("Aura is unavailable.").closest("[data-slot=marker]"),
    );
    expect(marker).toContain("bg-destructive/5");
    expect(marker).toContain("text-foreground");
    expect(marker).not.toContain("text-destructive");
  });

  it("the danger zone button keeps a foreground label, hover included", () => {
    render(
      <ToastProvider>
        <TooltipProvider>
          <MemoryRouter>
            <EnvironmentConfiguration
              environment={environments[0]}
              onEnvironmentUpdate={() => {}}
              editHref="/environments/env-001/edit"
              onDelete={() => {}}
            />
          </MemoryRouter>
        </TooltipProvider>
      </ToastProvider>,
    );
    const button = classes(
      screen.getByRole("button", { name: "Delete environment" }),
    );
    for (const tint of [
      "bg-destructive/10",
      "hover:bg-destructive/15",
      "dark:bg-destructive/15",
      "dark:hover:bg-destructive/25",
      "text-foreground",
      "hover:text-foreground",
    ])
      expect(button).toContain(tint);
    expect(button).not.toContain("text-destructive");
    expect(button).not.toContain("hover:text-destructive");
  });
});
