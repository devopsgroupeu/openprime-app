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
import { environments } from "./mocks/fixtures";

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

// A job can end after its page closed (push has no leave guard; generate can
// be left). The list reads the server again whenever it opens.
describe("environments list reload", () => {
  afterEach(() => window.history.pushState({}, "", "/"));

  const openList = () =>
    fireEvent.click(
      within(document.querySelector('[data-slot="sidebar"]')).getByRole(
        "link",
        { name: "Environments" },
      ),
    );
  const openStaging = async () => {
    window.history.pushState({}, "", "/environments/env-002");
    render(<App />);
    await screen.findByRole(
      "heading",
      { level: 1, name: "demo-staging" },
      { timeout: 3000 },
    );
  };

  test("loads the list once on the first visit", async () => {
    let loads = 0;
    server.use(
      http.get("*/environments", () => {
        loads += 1;
        return HttpResponse.json(environments);
      }),
    );
    window.history.pushState({}, "", "/environments");
    render(<App />);
    await screen.findByRole("link", { name: "demo-prod" }, { timeout: 3000 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(loads).toBe(1);
  });

  test("reloads when the list opens again and shows the newer status", async () => {
    await openStaging();
    // demo-staging was generated after its page closed.
    server.use(
      http.get("*/environments", () =>
        HttpResponse.json(
          environments.map((env) =>
            env.id === "env-002"
              ? {
                  ...env,
                  status: "running",
                  last_generate_at: new Date().toISOString(),
                  last_generate_status: "succeeded",
                }
              : env,
          ),
        ),
      ),
    );
    openList();

    const card = (
      await screen.findByRole("link", { name: "demo-staging" })
    ).closest("article");
    await waitFor(() =>
      expect(within(card).getByText("Ready")).toBeInTheDocument(),
    );
  });

  test("keeps the current list while it reloads and when the reload fails", async () => {
    await openStaging();
    let answer;
    server.use(
      http.get(
        "*/environments",
        () => new Promise((resolve) => (answer = resolve)),
      ),
    );
    openList();

    // No skeleton: the list it has stays up while the reload runs.
    expect(
      await screen.findByRole("link", { name: "demo-staging" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();

    await waitFor(() => expect(answer).toBeDefined());
    answer(
      HttpResponse.json({ error: "Database unavailable" }, { status: 503 }),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole("link", { name: "demo-staging" })).toBeVisible();
    expect(
      screen.queryByText("Couldn't load environments."),
    ).not.toBeInTheDocument();
  });
});

describe("palette on an environment page", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  const openPalette = async () => {
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    const palette = await screen.findByRole("dialog");
    return within(palette).getByRole("group", { name: "This environment" });
  };

  test("offers the environment's own actions and runs them", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    window.history.pushState({}, "", "/environments/env-002");
    render(<App />);
    await screen.findByRole(
      "heading",
      { level: 1, name: "demo-staging" },
      { timeout: 3000 },
    );

    let group = await openPalette();
    expect(
      within(group)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual([
      "Edit environment",
      "Generate repository",
      "Copy environment ID",
    ]);
    fireEvent.click(
      within(group).getByRole("option", { name: "Copy environment ID" }),
    );
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("env-002"));

    group = await openPalette();
    fireEvent.click(
      within(group).getByRole("option", { name: "Generate repository" }),
    );
    expect(
      await screen.findByText("Repository generated and downloaded."),
    ).toBeInTheDocument();

    group = await openPalette();
    fireEvent.click(
      within(group).getByRole("option", { name: "Edit environment" }),
    );
    await waitFor(() =>
      expect(window.location.pathname).toBe("/environments/env-002/edit"),
    );
  });

  test("disables Generate repository while a job runs", async () => {
    server.use(
      http.get("*/jobs/:jobId", ({ params }) =>
        HttpResponse.json({ id: params.jobId, status: "running" }),
      ),
    );
    window.history.pushState({}, "", "/environments/env-002");
    render(<App />);
    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: "Generate repository" },
        { timeout: 3000 },
      ),
    );
    await screen.findByRole("button", { name: /Generating/ });

    const group = await openPalette();
    expect(
      within(group).getByRole("option", { name: "Generate repository" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      within(group).getByRole("option", { name: "Copy environment ID" }),
    ).not.toHaveAttribute("aria-disabled", "true");
  });

  test("has no environment actions elsewhere", async () => {
    render(<App />);
    await screen.findByText(/demo-prod/i, {}, { timeout: 3000 });
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    const palette = await screen.findByRole("dialog");
    expect(
      within(palette).queryByRole("group", { name: "This environment" }),
    ).not.toBeInTheDocument();
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
