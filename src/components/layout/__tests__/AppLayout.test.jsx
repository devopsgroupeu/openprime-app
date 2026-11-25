import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
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

describe("AppLayout", () => {
  function renderLayout() {
    render(
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={["/environments"]}>
              <Routes>
                <Route element={<AppLayout environments={environments} />}>
                  <Route
                    path="/environments"
                    element={<Link to="/settings/account">Go to settings</Link>}
                  />
                  <Route path="/settings/account" element={<p>Settings</p>} />
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
    const scroller = screen.getByRole("main").querySelector(".overflow-y-auto");
    scroller.scrollTop = 400;

    fireEvent.click(screen.getByRole("link", { name: "Go to settings" }));

    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(scroller.scrollTop).toBe(0);
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
