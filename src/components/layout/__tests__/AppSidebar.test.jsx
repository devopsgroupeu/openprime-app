import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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

describe("AppSidebar on mobile", () => {
  const desktopWidth = window.innerWidth;
  beforeEach(() => {
    window.innerWidth = 390; // below md: the sidebar is a Sheet
  });
  afterEach(() => {
    window.innerWidth = desktopWidth;
  });

  function renderMobile(path, onSearch = () => {}) {
    render(
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[path]}>
            <SidebarProvider>
              <SidebarTrigger />
              <AppSidebar onSearch={onSearch} />
            </SidebarProvider>
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle sidebar" }));
    return screen.getByRole("dialog");
  }

  it("closes the sheet after navigating", async () => {
    const sheet = renderMobile("/settings/preferences");

    fireEvent.click(within(sheet).getByRole("link", { name: "Back to app" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes the sheet when tapping the current page", async () => {
    const sheet = renderMobile("/environments");

    fireEvent.click(within(sheet).getByRole("link", { name: "Environments" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes the sheet before opening search", async () => {
    const onSearch = vi.fn();
    const sheet = renderMobile("/environments", onSearch);

    fireEvent.click(within(sheet).getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
