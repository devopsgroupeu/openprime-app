import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import App from "./App";
import { server } from "./mocks/server";

// In mock mode (vitest runs with VITE_MOCK=true) the app auto-authenticates via
// the mock AuthProvider and loads its data from MSW — no real Keycloak/backend.
test("renders the authenticated app with mocked environments", async () => {
  render(<App />);

  // The app reaches the authenticated state and renders the mocked environments.
  expect(
    await screen.findByText(/demo-prod/i, {}, { timeout: 3000 }),
  ).toBeInTheDocument();
});

test("renders the shell and opens the command palette with Cmd+K", async () => {
  render(<App />);
  await screen.findByText(/demo-prod/i, {}, { timeout: 3000 });

  // Shell: sidebar nav; a list page has no breadcrumb (crumbs start at
  // depth 2, see AppLayout.test.jsx)
  const sidebar = document.querySelector('[data-slot="sidebar"]');
  expect(
    within(sidebar).getByRole("link", { name: "Environments" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.queryByRole("navigation", { name: "Breadcrumb" }),
  ).not.toBeInTheDocument();

  fireEvent.keyDown(document, { key: "k", metaKey: true });

  const palette = await screen.findByRole("dialog");
  expect(
    within(palette).getByPlaceholderText(
      "Search environments or jump to a page",
    ),
  ).toBeInTheDocument();
  // Environments come from the already-loaded list
  expect(within(palette).getByText("demo-prod")).toBeInTheDocument();
  expect(within(palette).getByText("Add AWS credentials")).toBeInTheDocument();
});

test("a failed list load shows the server message and the error ID", async () => {
  server.use(
    http.get("*/environments", () =>
      HttpResponse.json(
        { error: "Database unavailable" },
        { status: 503, headers: { "X-Request-ID": "req-7" } },
      ),
    ),
  );
  render(<App />);

  expect(
    await screen.findByText(
      "Couldn't load environments.",
      {},
      { timeout: 3000 },
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("Database unavailable")).toBeInTheDocument();
  expect(screen.getByText("req-7")).toBeInTheDocument();
});

describe("environment jobs", () => {
  beforeEach(() => {
    // jsdom has no blob URLs or anchor downloads.
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  test("the list shows the outcome of a job run on the detail page", async () => {
    window.history.pushState({}, "", "/environments/env-002");
    render(<App />);

    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Generate repository" },
        { timeout: 3000 },
      ),
    );
    await screen.findByText("Repository generated and downloaded.");
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    fireEvent.click(
      within(sidebar).getByRole("link", { name: "Environments" }),
    );

    const card = (
      await screen.findByRole("link", { name: "demo-staging" })
    ).closest("article");
    expect(within(card).getByText("Ready")).toBeInTheDocument();
  });
});

describe("settings routes", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  test.each(["/settings", "/settings/unknown"])(
    "%s lands on the Account tab",
    async (path) => {
      window.history.pushState({}, "", path);
      render(<App />);

      expect(
        await screen.findByRole(
          "heading",
          { level: 1, name: "Account" },
          { timeout: 3000 },
        ),
      ).toBeInTheDocument();
      expect(window.location.pathname).toBe("/settings/account");
    },
  );
});

describe("unknown routes", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  test("an unknown URL shows Page not found inside the shell", async () => {
    window.history.pushState({}, "", "/does-not-exist");
    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Page not found" },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar"]')).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Back to environments" }),
    ).toHaveAttribute("href", "/environments");
  });

  test("/environments/new opens the create wizard", async () => {
    window.history.pushState({}, "", "/environments/new");
    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: "Basics" },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/environments/create");
  });
});

describe("document title", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  // WCAG 2.4.2: "<h1> - OpenPrime"; the wizard names the task, not the step.
  test.each([
    ["/environments", "Environments - OpenPrime"],
    ["/environments/env-001", "demo-prod - OpenPrime"],
    ["/settings/preferences", "Preferences - OpenPrime"],
    ["/environments/create", "New environment - OpenPrime"],
    ["/environments/env-001/edit", "Edit demo-prod - OpenPrime"],
    ["/does-not-exist", "Page not found - OpenPrime"],
  ])("%s is titled %s", async (path, title) => {
    window.history.pushState({}, "", path);
    render(<App />);

    await waitFor(() => expect(document.title).toBe(title), {
      timeout: 3000,
    });
  });
});
