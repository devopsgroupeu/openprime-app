import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import UserMenu, { DOCS_URL } from "../UserMenu";

// Mock mode signs in "Mock User" (AuthProvider).
function renderMenu(onShortcuts = () => {}) {
  render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter>
          <SidebarProvider>
            <UserMenu onShortcuts={onShortcuts} />
          </SidebarProvider>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
  const trigger = screen.getByRole("button", { name: /Account menu/ });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  return trigger;
}

describe("UserMenu", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => document.documentElement.classList.remove("dark"));

  it("names the user and the menu, with their initials", () => {
    const trigger = renderMenu();

    expect(trigger).toHaveAccessibleName("Mock User, Account menu");
    expect(trigger).toHaveTextContent("MU");
    expect(screen.getByRole("menu")).toHaveTextContent("Mock User");
  });

  it("switches the theme from the Theme submenu", async () => {
    renderMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Theme" }));

    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Dark" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("openprime-theme-v2")).toBe("true");
  });

  it("links Settings and the docs, and opens the keyboard shortcuts", async () => {
    const onShortcuts = vi.fn();
    renderMenu(onShortcuts);

    expect(
      await screen.findByRole("menuitem", { name: "Settings" }),
    ).toHaveAttribute("href", "/settings/account");
    fireEvent.click(screen.getByRole("menuitem", { name: "Help" }));
    const docs = await screen.findByRole("menuitem", {
      name: /Documentation/,
    });
    expect(docs).toHaveAttribute("href", DOCS_URL);
    expect(docs).toHaveAttribute("target", "_blank");

    fireEvent.click(
      screen.getByRole("menuitem", { name: "Keyboard shortcuts" }),
    );
    expect(onShortcuts).toHaveBeenCalledTimes(1);
  });
});
