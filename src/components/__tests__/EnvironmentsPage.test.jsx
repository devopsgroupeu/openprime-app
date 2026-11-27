import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { server } from "../../mocks/server";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import EnvironmentsPage from "../EnvironmentsPage";
import { coverGradient } from "@/components/shared/cover-gradient";
import { formatDateTime, formatRelative } from "@/components/shared/format";

const prod = {
  id: "env-1",
  name: "demo-prod",
  global_prefix: "op-",
  provider: "aws",
  region: "eu-west-1",
  status: "pending",
  last_generate_at: "2026-06-19T10:00:00Z",
  last_generate_status: "succeeded",
  services: {
    vpc: { enabled: true },
    eks: { enabled: true },
    rds: { enabled: true },
  },
  updated_at: "2026-06-20T12:00:00Z",
};
const staging = {
  id: "env-2",
  name: "demo-staging",
  global_prefix: "stg-",
  provider: "aws",
  region: "eu-west-3",
  status: "pending",
  services: { vpc: { enabled: true }, s3: { enabled: true } },
  updated_at: "2026-06-22T08:30:00Z",
};
const sandbox = {
  id: "env-3",
  name: "zeta-sandbox",
  global_prefix: "sbx-",
  provider: "aws",
  region: "us-east-1",
  status: "pending",
  last_generate_at: "2026-06-10T10:00:00Z",
  last_generate_status: "failed",
  services: {
    vpc: { enabled: true },
    eks: { enabled: true },
    rds: { enabled: true },
    s3: { enabled: true },
    sqs: { enabled: true },
    sns: { enabled: true },
    lambda: { enabled: true },
    ecr: { enabled: true },
  },
  updated_at: "2026-06-01T00:00:00Z",
};
const ALL = [prod, staging, sandbox];

// Shows the query string, so tests can read the URL state.
function Search() {
  return <output aria-label="Query">{useLocation().search}</output>;
}

// The app shell provides the tooltips; the page needs Theme (Toast) and a router.
function renderPage(props = {}, path = "/environments") {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[path]}>
            <Search />
            <Routes>
              <Route
                path="/environments"
                element={<EnvironmentsPage environments={ALL} {...props} />}
              />
              <Route path="/environments/:id/edit" element={<p>Wizard</p>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

// Card titles are h2: the page's h1 is "Environments".
const cardNames = () =>
  screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
const search = () =>
  screen.getByRole("searchbox", { name: "Search environments" });
const openMenu = (name) =>
  fireEvent.pointerDown(
    screen.getByRole("button", { name: `More actions for ${name}` }),
    { button: 0, ctrlKey: false },
  );
const pickSort = async (label) => {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Sort environments" }),
    {
      key: "Enter",
    },
  );
  fireEvent.keyDown(await screen.findByRole("option", { name: label }), {
    key: "Enter",
  });
};

beforeEach(() => {
  localStorage.clear();
});

describe("EnvironmentsPage", () => {
  it("shows the header, the stat strip and a card per environment", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Environments" }),
    ).toBeInTheDocument();
    // Facts the filter tabs do not already show; the last successful
    // generate across the environments.
    const stats = Array.from(
      document.querySelectorAll('[data-slot="stat-card"]'),
    );
    expect(stats.map((card) => card.firstChild.textContent)).toEqual([
      "Environments",
      "Services enabled",
      "Regions",
      "Last generated",
    ]);
    expect(
      stats.slice(0, 3).map((card) => card.children[1].textContent),
    ).toEqual(["3", "13", "3"]);
    // Each tile's picture: statuses, top categories, regions by city.
    expect(within(stats[0]).getByText("Not generated")).toBeInTheDocument();
    expect(within(stats[1]).getAllByRole("listitem")).toHaveLength(3);
    expect(within(stats[2]).getByText("Ireland")).toBeInTheDocument();
    expect(
      within(stats[3]).getByText(formatRelative(prod.last_generate_at)),
    ).toBeInTheDocument();
    // Recently modified first by default.
    expect(cardNames()).toEqual(["demo-staging", "demo-prod", "zeta-sandbox"]);
    expect(screen.getByRole("link", { name: "demo-prod" })).toHaveAttribute(
      "href",
      "/environments/env-1",
    );
    expect(screen.getByText("3 environments")).toBeInTheDocument();
  });

  // The environment's generated band, the same one its detail page shows;
  // decorative, so it is hidden from screen readers.
  it("tops each card with the environment's decorative cover band", () => {
    renderPage();
    const card = screen
      .getByRole("link", { name: "demo-prod" })
      .closest("article");
    const band = card.querySelector('[data-slot="cover-gradient"]');
    expect(band).toHaveAttribute("aria-hidden", "true");
    const { gradient, layout } = coverGradient("env-1");
    expect(band).toHaveAttribute("data-gradient", String(gradient));
    expect(band).toHaveAttribute("data-layout", String(layout));
    // The provider avatar sits on the band, inside its decorative layer.
    expect(band.querySelector('[data-slot="icon-tile"]')).not.toBeNull();
  });

  // One name for the prefix, as in the wizard and Review.
  it("names the resource prefix on the card", () => {
    renderPage();
    const card = screen
      .getByRole("link", { name: "demo-prod" })
      .closest("article");
    // The description runs region, then "Resource prefix" and the value.
    expect(within(card).getByText(/Resource prefix/)).toBeInTheDocument();
    expect(within(card).getByText("op-")).toHaveClass("font-mono");
  });

  it("shows up to six service icons and counts the rest", () => {
    renderPage();
    const card = screen
      .getByRole("link", { name: "zeta-sandbox" })
      .closest("article");
    const icons = within(card).getByRole("list", { name: "Enabled services" });
    expect(within(icons).getAllByRole("listitem")).toHaveLength(7);
    expect(within(icons).getByText("+2")).toBeInTheDocument();
  });

  // The stretched card link covers the card, the modified time included, so a
  // click on the time opens the card; screen readers hear the exact time.
  it("shows when a card was modified and leaves its clicks to the card link", () => {
    renderPage();
    const card = screen
      .getByRole("link", { name: "demo-prod" })
      .closest("article");
    const exact = formatDateTime(prod.updated_at);
    expect(within(card).getByText(`, ${exact}`)).toHaveClass("sr-only");

    // Not raised above the stretched link (z-10) by a hover-only tooltip
    // trigger, so a click on the time opens the environment.
    const time = within(card).getByText(formatRelative(prod.updated_at));
    expect(time.closest(".z-10")).toBeNull();
    expect(time.closest("[data-state]")).toBeNull();
  });

  const filterTabs = () =>
    within(screen.getByRole("group", { name: "Show" }))
      .getAllByRole("button")
      .map((b) => b.textContent);

  it("offers All and the statuses that occur, Ready first", () => {
    renderPage({ environments: [staging, sandbox, prod] });
    expect(filterTabs()).toEqual([
      "All 3",
      "Ready 1",
      "Not generated 1",
      "Failed 1",
    ]);
  });

  it("offers no tab for a status that does not occur", () => {
    renderPage({ environments: [staging] });
    expect(filterTabs()).toEqual(["All 1", "Not generated 1"]);
  });

  it("labels the cards by the last job outcome", () => {
    renderPage();
    const status = (name) =>
      within(screen.getByRole("link", { name }).closest("article")).getByText(
        /Ready|Not generated|Failed/,
      ).textContent;
    expect(status("demo-prod")).toBe("Ready");
    expect(status("demo-staging")).toBe("Not generated");
    expect(status("zeta-sandbox")).toBe("Failed");
  });

  it("searches by name, prefix and region", () => {
    renderPage();

    fireEvent.change(search(), { target: { value: "eu-west-3" } });
    expect(cardNames()).toEqual(["demo-staging"]);
    expect(screen.getByText("1 environment")).toBeInTheDocument();

    fireEvent.change(search(), { target: { value: "SBX" } });
    expect(cardNames()).toEqual(["zeta-sandbox"]);

    fireEvent.change(search(), { target: { value: "demo" } });
    expect(cardNames()).toEqual(["demo-staging", "demo-prod"]);
  });

  it("filters by status and keeps the filter in the URL", async () => {
    renderPage();
    const query = screen.getByRole("status", { name: "Query" });

    const notGenerated = screen.getByRole("button", {
      name: "Not generated 1",
    });
    fireEvent.click(notGenerated);
    await waitFor(() =>
      expect(notGenerated).toHaveAttribute("aria-pressed", "true"),
    );
    expect(cardNames()).toEqual(["demo-staging"]);
    expect(query).toHaveTextContent("?status=not-generated");

    fireEvent.click(screen.getByRole("button", { name: "Failed 1" }));
    await waitFor(() => expect(cardNames()).toEqual(["zeta-sandbox"]));
    expect(query).toHaveTextContent("?status=failed");

    fireEvent.click(screen.getByRole("button", { name: "All 3" }));
    await waitFor(() => expect(cardNames()).toHaveLength(3));
    expect(query).toBeEmptyDOMElement();
  });

  it("opens with the status filter from the URL", () => {
    renderPage({}, "/environments?status=ready");
    expect(screen.getByRole("button", { name: "Ready 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(cardNames()).toEqual(["demo-prod"]);
  });

  it("treats a status no environment has as All and drops it from the URL", async () => {
    renderPage({}, "/environments?status=stopped");
    expect(screen.getByRole("button", { name: "All 3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(cardNames()).toHaveLength(3);
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Query" }),
      ).toBeEmptyDOMElement(),
    );
  });

  it("sorts by name or by services and remembers the choice", async () => {
    const { unmount } = renderPage();

    await pickSort("Name A to Z");
    expect(cardNames()).toEqual(["demo-prod", "demo-staging", "zeta-sandbox"]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "openprime-environments-sort",
      "name",
    );

    await pickSort("Most services");
    expect(cardNames()).toEqual(["zeta-sandbox", "demo-prod", "demo-staging"]);

    unmount();
    renderPage();
    expect(
      screen.getByRole("combobox", { name: "Sort environments" }),
    ).toHaveTextContent("Most services");
    expect(cardNames()).toEqual(["zeta-sandbox", "demo-prod", "demo-staging"]);
  });

  it("ignores an unknown stored sort", () => {
    localStorage.setItem("openprime-environments-sort", "bogus");
    renderPage();
    expect(
      screen.getByRole("combobox", { name: "Sort environments" }),
    ).toHaveTextContent("Recently modified");
  });

  it("recovers from a search without matches with Clear search", () => {
    renderPage();

    fireEvent.change(search(), { target: { value: "nope" } });
    expect(screen.getByText("No environments found")).toBeInTheDocument();
    expect(
      screen.getByText('No environments match "nope".'),
    ).toBeInTheDocument();
    expect(screen.getByText("No environments")).toBeInTheDocument();

    // The empty state's button, not the field's own X.
    const empty = document.querySelector('[data-slot="empty-state"]');
    fireEvent.click(
      within(empty).getByRole("button", { name: "Clear search" }),
    );
    expect(search()).toHaveValue("");
    expect(cardNames()).toHaveLength(3);
  });

  it("recovers from a status filter without matches with Clear filters", async () => {
    renderPage({}, "/environments?status=not-generated");

    fireEvent.change(search(), { target: { value: "prod" } });
    expect(screen.getByText("No environments found")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(search()).toHaveValue("");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "All 3" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(cardNames()).toHaveLength(3);
    expect(screen.getByRole("status", { name: "Query" })).toBeEmptyDOMElement();
  });

  it("shows the first-run empty state with the setup tips", async () => {
    server.use(
      http.get("*/cloud-credentials", () =>
        HttpResponse.json({ credentials: [] }),
      ),
    );
    renderPage({ environments: [] });

    expect(screen.getByText("No environments yet")).toBeInTheDocument();
    // The environments icon of the sidebar and the palette, not on-premises.
    const empty = screen
      .getByText("No environments yet")
      .closest('[data-slot="empty-state"]');
    expect(empty.querySelector("svg")).toHaveClass("lucide-layers");
    // One way forward: the empty state's button, not the header's as well.
    const create = screen.getAllByRole("link", { name: "New environment" });
    expect(create).toHaveLength(1);
    expect(create[0]).toHaveAttribute("href", "/environments/create");
    expect(
      await screen.findByRole("link", { name: "Add AWS credentials" }),
    ).toHaveAttribute("href", "/settings/cloud-credentials");
    // The wizard can create the state bucket; no tip says to bring one.
    expect(
      screen.getByText(
        "The wizard can create the S3 bucket for Terraform state.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/S3 bucket name ready/)).not.toBeInTheDocument();
    // Nothing to search or count yet.
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="stat-card"]'),
    ).not.toBeInTheDocument();
  });

  it("ticks off credentials once they exist, without a flash of the link", async () => {
    renderPage({ environments: [] });
    // Nothing about credentials until the check has answered.
    expect(
      screen.queryByRole("link", { name: "Add AWS credentials" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("AWS credentials are added."),
    ).toBeInTheDocument();
  });

  it("keeps the status filter in the URL when the list fails to load", () => {
    renderPage(
      { environments: [], loadError: { message: "boom" }, onRetry: () => {} },
      "/environments?status=ready",
    );

    expect(screen.getByRole("status", { name: "Query" })).toHaveTextContent(
      "?status=ready",
    );
  });

  it("shows the error state with Try again", () => {
    const onRetry = vi.fn();
    renderPage({ environments: [], loadError: { message: "boom" }, onRetry });

    expect(screen.getByText("Couldn't load environments.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByText("No environments yet")).not.toBeInTheDocument();
  });

  it("reloads the list when it opens with environments", () => {
    const onRefresh = vi.fn();
    renderPage({ onRefresh });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not reload while the first load is running", () => {
    const onRefresh = vi.fn();
    renderPage({ environments: [], loading: true, onRefresh });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("shows a skeleton while loading, stat strip included", () => {
    renderPage({ environments: [], loading: true });
    const skeleton = screen.getByRole("status", { name: "Loading" });
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    // The cards do not jump when the strip arrives.
    expect(
      skeleton.querySelectorAll('[data-slot="stat-card-skeleton"]'),
    ).toHaveLength(4);
    expect(screen.queryByText("No environments yet")).not.toBeInTheDocument();
  });

  it("opens the wizard from Edit", async () => {
    renderPage();
    openMenu("demo-prod");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByText("Wizard")).toBeInTheDocument();
  });

  it("copies the environment ID", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderPage();

    openMenu("demo-prod");
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Copy environment ID" }),
    );
    expect(writeText).toHaveBeenCalledWith("env-1");
    expect(
      await screen.findByText("Environment ID copied"),
    ).toBeInTheDocument();
  });

  it("deletes after confirmation", async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    renderPage({ onDelete });

    openMenu("demo-prod");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText('Delete "demo-prod"?')).toBeInTheDocument();
    // Environments are confirmed by typing their name.
    const confirm = within(dialog).getByRole("button", { name: "Delete" });
    expect(confirm).toBeDisabled();
    fireEvent.change(
      within(dialog).getByLabelText("Type demo-prod to confirm"),
      {
        target: { value: "demo-prod" },
      },
    );
    fireEvent.click(confirm);

    expect(await screen.findByText("Deleted demo-prod.")).toBeInTheDocument();
    expect(onDelete).toHaveBeenCalledWith("env-1");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });

  it("toasts a failed delete", async () => {
    const onDelete = vi.fn(() => Promise.reject(new Error("Server said no")));
    renderPage({ onDelete });

    openMenu("demo-prod");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.change(
      within(dialog).getByLabelText("Type demo-prod to confirm"),
      {
        target: { value: "demo-prod" },
      },
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Couldn't delete demo-prod: Server said no"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Server said no/)).toBeInTheDocument();
  });

  it("asks to check the connection when the delete request fails", async () => {
    const onDelete = vi.fn(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    renderPage({ onDelete });

    openMenu("demo-prod");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.change(
      within(dialog).getByLabelText("Type demo-prod to confirm"),
      {
        target: { value: "demo-prod" },
      },
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "Couldn't delete demo-prod. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("has no Delete without a delete handler", async () => {
    renderPage();
    openMenu("demo-prod");
    await screen.findByRole("menuitem", { name: "Edit" });
    expect(
      screen.queryByRole("menuitem", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });
});
