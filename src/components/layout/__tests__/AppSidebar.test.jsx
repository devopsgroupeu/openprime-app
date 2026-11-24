import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import AppSidebar from "../AppSidebar";

function renderSidebar(path) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <SidebarProvider>
            <AppSidebar onSearch={() => {}} />
          </SidebarProvider>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe("AppSidebar", () => {
  it("shows the platform nav with Environments active on /environments", () => {
    renderSidebar("/environments");

    const link = screen.getByRole("link", { name: "Environments" });
    expect(link).toHaveAttribute("href", "/environments");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "New environment" }),
    ).toHaveAttribute("href", "/environments/create");
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back to app" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Environments active on an environment detail page", () => {
    renderSidebar("/environments/env-1");

    expect(screen.getByRole("link", { name: "Environments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("swaps to the settings nav on /settings/*", () => {
    renderSidebar("/settings/preferences");

    expect(screen.getByRole("link", { name: "Back to app" })).toHaveAttribute(
      "href",
      "/environments",
    );
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/settings/account",
    );
    expect(
      screen.getByRole("link", { name: "Cloud credentials" }),
    ).toHaveAttribute("href", "/settings/cloud-credentials");

    const preferences = screen.getByRole("link", { name: "Preferences" });
    expect(preferences).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Account" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.queryByRole("link", { name: "Environments" }),
    ).not.toBeInTheDocument();
  });
});
