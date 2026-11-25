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

function renderLayout() {
  render(
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={["/environments"]}>
            <Routes>
              <Route element={<AppLayout environments={[]} />}>
                <Route path="/environments" element={<h1>Environments</h1>} />
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

  it("shows the shell and the wait in the content area", async () => {
    let answer;
    loadCatalog.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    renderLayout();

    const main = screen.getByRole("main");
    expect(within(main).getByRole("status")).toHaveTextContent(
      "Loading the service catalog...",
    );
    expect(
      within(document.querySelector('[data-slot="sidebar"]')).getByRole(
        "link",
        { name: "Environments" },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Environments" })).toBeNull();

    answer(CATALOG);
    expect(
      await screen.findByRole("heading", { name: "Environments" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
