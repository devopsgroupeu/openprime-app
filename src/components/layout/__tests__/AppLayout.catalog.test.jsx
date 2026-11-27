import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import { environments } from "../../../mocks/fixtures";
import authService from "../../../services/authService";
import { loadCatalog } from "../../../services/catalogService";
import EnvironmentDetailPage from "../../EnvironmentDetailPage";
import EnvironmentsPage from "../../EnvironmentsPage";
import WizardPage from "../../WizardPage";
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

const [prod] = environments;

function renderLayout(path) {
  render(
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<AppLayout environments={[prod]} />}>
                  <Route
                    path="/environments"
                    element={<EnvironmentsPage environments={[prod]} />}
                  />
                  <Route path="/environments/create" element={<WizardPage />} />
                  <Route
                    path="/environments/:id"
                    element={<EnvironmentDetailPage />}
                  />
                  <Route
                    path="/environments/:id/edit"
                    element={<WizardPage />}
                  />
                  <Route path="*" element={<p>The page</p>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}

const pendingCatalog = () => {
  let answer;
  loadCatalog.mockReturnValue(new Promise((resolve) => (answer = resolve)));
  return () => act(async () => answer(CATALOG));
};
const busyRegions = () => document.querySelectorAll('[aria-busy="true"]');

describe("AppLayout while the service catalog loads", () => {
  afterEach(() => vi.clearAllMocks());

  // One skeleton that the page replaces in place: the header is not
  // remounted (no replayed entrance) and focus in it stays.
  it("keeps the list's header, and the focus in it, when the catalog arrives", async () => {
    const answer = pendingCatalog();
    renderLayout("/environments");

    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("status", { name: "Loading environments" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(busyRegions()).toHaveLength(1);
    const heading = within(main).getByRole("heading", {
      level: 1,
      name: "Environments",
    });
    const create = within(main).getByRole("link", { name: "New environment" });
    act(() => create.focus());

    await answer();
    expect(busyRegions()).toHaveLength(0);
    expect(
      within(main).getByRole("link", { name: prod.name }),
    ).toBeInTheDocument();
    expect(within(main).getByRole("heading", { level: 1 })).toBe(heading);
    expect(create).toHaveFocus();
  });

  it("keeps a detail page in its skeleton until the catalog is there", async () => {
    const answer = pendingCatalog();
    const get = vi.spyOn(authService, "get");
    renderLayout(`/environments/${prod.id}`);

    const main = screen.getByRole("main");
    // The environment itself arrives first.
    expect(get).toHaveBeenCalledWith(`/environments/${prod.id}`);
    await act(() => Promise.all(get.mock.results.map((r) => r.value)));
    expect(
      within(main).getByRole("status", { name: "Loading environment" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(within(main).queryByRole("heading", { level: 1 })).toBeNull();

    await answer();
    expect(
      await within(main).findByRole("heading", { level: 1, name: prod.name }),
    ).toBeInTheDocument();
    expect(busyRegions()).toHaveLength(0);
    get.mockRestore();
  });

  // The wizard builds its state from the catalog when it opens.
  it.each([
    ["/environments/create", "Loading the wizard"],
    [`/environments/${prod.id}/edit`, "Loading environment"],
  ])("waits on %s with the wizard's skeleton", (path, busy) => {
    pendingCatalog();
    renderLayout(path);

    const main = screen.getByRole("main");
    expect(within(main).getByRole("status", { name: busy })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(busyRegions()).toHaveLength(1);
  });

  // Settings and Not found do not read the catalog.
  it.each(["/settings/preferences", "/settings", "/nowhere"])(
    "shows %s without waiting for the catalog",
    (path) => {
      pendingCatalog();
      renderLayout(path);

      expect(screen.getByText("The page")).toBeInTheDocument();
      expect(busyRegions()).toHaveLength(0);
    },
  );
});
