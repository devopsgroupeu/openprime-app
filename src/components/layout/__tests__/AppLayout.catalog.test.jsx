import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { loadCatalog } from "../../../services/catalogService";
import AppLayout from "../AppLayout";

// The runtime catalog on (CatalogProvider starts loading); its request is
// answered by each test.
vi.mock("../../../config/servicesConfig", async (importOriginal) => ({
  ...(await importOriginal()),
  USE_RUNTIME_CATALOG: true,
}));
vi.mock("../../../services/catalogService", () => ({ loadCatalog: vi.fn() }));

const CATALOG = {
  schemaVersion: 1,
  provider: "aws",
  commit: "abc123",
  services: {
    eks: {
      displayName: "EKS",
      description: "",
      category: "compute",
      fields: {},
    },
  },
};

function renderLayout(path = "/environments") {
  render(
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<AppLayout environments={[]} />}>
                <Route path="*" element={<p>The page</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe("AppLayout while the service catalog loads", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the shell and the list's own loading state in the content area", async () => {
    let answer;
    loadCatalog.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    renderLayout();

    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("status", { name: "Loading environments" }),
    ).toHaveAttribute("aria-busy", "true");
    // The list's static header, as the page shows it while it loads.
    expect(
      within(main).getByRole("heading", { level: 1, name: "Environments" }),
    ).toBeInTheDocument();
    expect(
      within(document.querySelector('[data-slot="sidebar"]')).getByRole(
        "link",
        { name: "Environments" },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("The page")).toBeNull();

    answer(CATALOG);
    expect(await screen.findByText("The page")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  // The page's own skeleton, so nothing moves when the catalog arrives.
  it.each([
    ["/environments/env-1", "Loading environment", null],
    ["/environments/env-1/edit", "Loading environment", null],
    ["/environments/create", "Loading the wizard", null],
    ["/settings/preferences", "Loading preferences", "Preferences"],
  ])("waits on %s with that page's skeleton", (path, busy, heading) => {
    loadCatalog.mockReturnValue(new Promise(() => {}));
    renderLayout(path);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("status", { name: busy })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
    if (heading) {
      expect(
        within(main).getByRole("heading", { level: 1, name: heading }),
      ).toBeInTheDocument();
    } else {
      expect(within(main).queryByRole("heading", { level: 1 })).toBeNull();
    }
  });
});
