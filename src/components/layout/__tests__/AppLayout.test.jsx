import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Link, MemoryRouter, Route, Routes, useParams } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { server } from "../../../mocks/server";
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

  // The router opens the wizard for these too (a trailing slash, any case).
  it.each(["/environments/create/", "/Environments/Create"])(
    "reads %s as the new environment wizard",
    (path) => {
      expect(breadcrumbsFor(path, environments)).toEqual([
        { label: "Environments", to: "/environments" },
        { label: "New environment" },
      ]);
    },
  );
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

// A page that fails to render.
function Crash() {
  throw new Error("page bug");
}

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
                    element={
                      <>
                        <Link to="/settings/account">Go to settings</Link>
                        <Link to="/environments/env-1">Open demo-prod</Link>
                      </>
                    }
                  />
                  <Route path="/environments/create" element={<p>Wizard</p>} />
                  <Route
                    path="/environments/:id/edit"
                    element={<p>Wizard</p>}
                  />
                  <Route path="/environments/:id" element={<Crash />} />
                  <Route path="/settings/:tab" element={<SettingsTab />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>,
    );
  }
  const sidebar = () => document.querySelector('[data-slot="sidebar"]');
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

  // One Aura per screen: the wizard has its own panel, and fills the area.
  it.each([
    "/environments/create",
    "/environments/create/",
    "/Environments/Create",
    "/environments/env-1/edit",
  ])("has no floating Aura launcher on %s", (path) => {
    renderLayout(path);

    const wizard = screen.getByText("Wizard");
    expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
    expect(wizard.closest('[data-slot="page-scroller"] > div')).toHaveClass(
      "h-full",
    );
  });

  // The palette, a link or a crash page in the same render as the reset.
  it("shows a page that crashes on the way in inside the shell", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderLayout();

    fireEvent.click(screen.getByRole("link", { name: "Open demo-prod" }));
    const main = screen.getByRole("main");
    expect(
      await within(main).findByRole("heading", {
        level: 1,
        name: "Something went wrong.",
      }),
    ).toBeInTheDocument();
    expect(
      within(sidebar()).getByRole("link", { name: "Environments" }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(sidebar()).getByRole("link", { name: "Environments" }),
    );
    expect(
      await screen.findByRole("link", { name: "Open demo-prod" }),
    ).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("has the floating Aura launcher on other pages", () => {
    renderLayout();

    expect(
      screen.getByRole("button", { name: "Ask Aura" }),
    ).toBeInTheDocument();
  });

  // The wizard has its own Aura; the floating one is kept, closed and out of
  // sight there, so its conversation comes back after a wizard visit.
  it("keeps the floating Aura conversation across a wizard visit", async () => {
    server.use(
      http.post(
        "*/ai/chat",
        () =>
          new HttpResponse(
            'data: {"chunk":"Use eu-west-1."}\n\ndata: {"done":true}\n\n',
            { headers: { "Content-Type": "text/event-stream" } },
          ),
      ),
    );
    renderLayout();
    fireEvent.click(screen.getByRole("button", { name: "Ask Aura" }));
    const input = screen.getByRole("textbox", { name: /Message Aura/ });
    fireEvent.change(input, { target: { value: "Which region?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText("Use eu-west-1.")).toBeInTheDocument();

    fireEvent.click(
      within(sidebar()).getByRole("link", { name: "New environment" }),
    );
    expect(await screen.findByText("Wizard")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Aura" })).toBeNull();
    expect(screen.queryByText("Use eu-west-1.")).toBeNull();

    fireEvent.click(
      within(sidebar()).getByRole("link", { name: "Environments" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Ask Aura" }));
    const again = await screen.findByRole("dialog", { name: "Aura" });
    expect(within(again).getByText("Which region?")).toBeInTheDocument();
    expect(within(again).getByText("Use eu-west-1.")).toBeInTheDocument();
  });

  describe("a page that crashes", () => {
    beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
    afterEach(() => vi.restoreAllMocks());

    it("shows the crash in the content area, the shell intact", () => {
      renderLayout("/environments/env-1");

      const main = screen.getByRole("main");
      expect(
        within(main).getByRole("heading", {
          level: 1,
          name: "Something went wrong.",
        }),
      ).toBeInTheDocument();
      expect(
        within(main).getByRole("button", { name: "Reload" }),
      ).toBeInTheDocument();
      expect(
        within(main).getByRole("link", { name: "Back to environments" }),
      ).toHaveAttribute("href", "/environments");
      expect(
        within(sidebar()).getByRole("link", { name: "Environments" }),
      ).toBeInTheDocument();
      expect(
        within(main).getByRole("navigation", { name: "Breadcrumb" }),
      ).toBeInTheDocument();
    });

    it("clears the crash when the user navigates away", async () => {
      renderLayout("/environments/env-1");
      screen.getByRole("heading", { name: "Something went wrong." });

      fireEvent.click(
        within(sidebar()).getByRole("link", { name: "Environments" }),
      );

      expect(
        await screen.findByRole("link", { name: "Go to settings" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Something went wrong." }),
      ).toBeNull();
    });
  });

  // The crash boundary resets on a route change without remounting the page:
  // settings tabs keep their unsaved edits.
  it("keeps a page mounted when only its route parameter changes", async () => {
    renderLayout("/settings/account");
    fireEvent.change(screen.getByLabelText("Draft"), {
      target: { value: "kept" },
    });

    fireEvent.click(screen.getByRole("link", { name: "Preferences tab" }));

    expect(
      await screen.findByRole("heading", { name: "preferences" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Draft")).toHaveValue("kept");
  });

  // Layout is CSS (checked in screenshots): the room kept under the last card
  // for the Aura launcher would lift a SaveBar off its resting place at the
  // end of the page, so a page with one goes without it. It also fills the
  // screen, so the bar rests at the bottom (under the Aura window), not in
  // the middle of a short page.
  it("keeps no launcher room under a page with a save bar", () => {
    renderLayout();
    const scroller = screen
      .getByRole("main")
      .querySelector('[data-slot="page-scroller"]');

    expect(scroller.firstElementChild).toHaveClass(
      "pb-16",
      "has-[[data-slot=save-bar]]:pb-0",
      "has-[[data-slot=save-bar]]:flex",
      "has-[[data-slot=save-bar]]:min-h-full",
      "has-[[data-slot=save-bar]]:flex-col",
    );
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

  // Aura says hello once per page load, on the environments list only.
  describe("Aura greeting", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());
    const greeting = () =>
      screen.queryByRole("button", { name: /Hi, I'm Aura/ });
    const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

    it("greets on the environments list once it has settled", () => {
      renderLayout();
      expect(greeting()).toBeNull();

      wait(1000);
      expect(greeting()).toBeVisible();
    });

    it("does not greet again after going to another page and back", () => {
      renderLayout();
      wait(1000);

      fireEvent.click(screen.getByRole("link", { name: "Go to settings" }));
      expect(greeting()).toBeNull();
      fireEvent.click(
        within(sidebar()).getByRole("link", { name: "Back to app" }),
      );
      expect(
        screen.getByRole("link", { name: "Go to settings" }),
      ).toBeVisible();
      wait(20000);
      expect(greeting()).toBeNull();
    });

    it.each(["/settings/account", "/environments/create"])(
      "does not greet on %s",
      (path) => {
        renderLayout(path);
        wait(20000);
        expect(greeting()).toBeNull();
      },
    );
  });
});
