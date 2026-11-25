import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useParams } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import AppLayout, { breadcrumbsFor } from "../AppLayout";
import AppTopBar from "../AppTopBar";

const environments = [{ id: "env-1", name: "demo-prod" }];

describe("breadcrumbsFor", () => {
  it("has no crumbs on depth-1 and settings pages", () => {
    expect(breadcrumbsFor("/environments", environments)).toEqual([]);
    expect(breadcrumbsFor("/settings/account", environments)).toEqual([]);
  });

  it("names the environment on its detail page", () => {
    expect(breadcrumbsFor("/environments/env-1", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "demo-prod" },
    ]);
    expect(breadcrumbsFor("/environments/unknown", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "Environment" },
    ]);
  });

  it("names the wizard's task, and the environment it edits as saved", () => {
    expect(breadcrumbsFor("/environments/create", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "New environment" },
    ]);
    expect(breadcrumbsFor("/environments/env-1/edit", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "demo-prod", to: "/environments/env-1" },
      { label: "Edit" },
    ]);
    expect(
      breadcrumbsFor("/environments/unknown/edit", environments)[1],
    ).toEqual({ label: "Environment", to: "/environments/unknown" });
  });
});

describe("AppTopBar", () => {
  it("links every crumb but the last, which is the current page", () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppTopBar
            breadcrumbs={breadcrumbsFor("/environments/env-1", environments)}
          />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(crumbs).getByRole("link", { name: "Environments" }),
    ).toHaveAttribute("href", "/environments");
    expect(within(crumbs).getByText("demo-prod")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

// A settings tab with a field: a tab switch must keep what was typed.
function SettingsTab() {
  const { tab } = useParams();
  return (
    <>
      <h1>{tab}</h1>
      <input aria-label="Draft" />
      <Link to="/settings/preferences">Preferences tab</Link>
    </>
  );
}

describe("AppLayout", () => {
  function renderLayout(path = "/environments") {
    render(
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<AppLayout environments={environments} />}>
                  <Route
                    path="/environments"
                    element={<Link to="/settings/account">Go to settings</Link>}
                  />
                  <Route path="/environments/create" element={<p>Wizard</p>} />
                  <Route
                    path="/environments/:id/edit"
                    element={<p>Wizard</p>}
                  />
                  <Route path="/settings/:tab" element={<SettingsTab />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>,
    );
  }
  const togglePalette = () =>
    fireEvent.keyDown(document, { key: "k", metaKey: true });
  const paletteInput = () =>
    screen.getByPlaceholderText("Search environments or jump to a page");

  it("starts every page at the top of the scroll area", async () => {
    renderLayout();
    const scroller = screen
      .getByRole("main")
      .querySelector('[data-slot="page-scroller"]');
    scroller.scrollTop = 400;

    fireEvent.click(screen.getByRole("link", { name: "Go to settings" }));

    expect(
      await screen.findByRole("heading", { name: "account" }),
    ).toBeInTheDocument();
    expect(scroller.scrollTop).toBe(0);
  });

  // One Aura per screen: the wizard has its own panel.
  it.each(["/environments/create", "/environments/env-1/edit"])(
    "has no floating Aura launcher on %s",
    (path) => {
      renderLayout(path);

      expect(screen.getByText("Wizard")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
    },
  );

  it("has the floating Aura launcher on other pages", () => {
    renderLayout();

    expect(
      screen.getByRole("button", { name: "Ask Aura" }),
    ).toBeInTheDocument();
  });

  it("skips the sidebar and top bar to the main landmark", () => {
    renderLayout();

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("opens the command palette from Search", async () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("dialog")).toContainElement(paletteInput());
  });

  it("forgets the query when Cmd+K closes the palette", async () => {
    renderLayout();
    togglePalette();
    fireEvent.change(paletteInput(), { target: { value: "dev" } });

    togglePalette();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    togglePalette();

    expect(paletteInput()).toHaveValue("");
  });
});
