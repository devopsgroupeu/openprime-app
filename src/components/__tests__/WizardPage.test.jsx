import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import WizardPage from "../WizardPage";

// WizardPage is a full page: it needs Theme/Auth (AppHeader), Toast, and a
// router (useParams/useNavigate). In mock mode AuthProvider auto-authenticates.
function renderWizard() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/environments/create"]}>
            <Routes>
              <Route
                path="/environments/create"
                element={
                  <WizardPage
                    onCreateEnvironment={vi.fn()}
                    onUpdateEnvironment={vi.fn()}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

// Edit mode: MSW serves the snake_case fixture from src/mocks/fixtures.js at
// GET /environments/env-001, exactly as the real API does.
function renderWizardEdit(onUpdateEnvironment) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/environments/env-001/edit"]}>
            <Routes>
              <Route
                path="/environments/:id/edit"
                element={
                  <WizardPage
                    onCreateEnvironment={vi.fn()}
                    onUpdateEnvironment={onUpdateEnvironment}
                  />
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("WizardPage", () => {
  it("renders the wizard chrome (sidebar, step content, footer) in create mode", async () => {
    renderWizard();

    // Sidebar steps (extracted WizardStepSidebar + stepDefs)
    expect(await screen.findByText("Basic Configuration")).toBeInTheDocument();
    expect(screen.getByText("Services Configuration")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();

    // Title + step-1 content (WizardStepContent -> BasicConfigStep)
    expect(screen.getByText("Create New Environment")).toBeInTheDocument();
    expect(screen.getByText("Environment Name")).toBeInTheDocument();

    // Footer (extracted WizardFooter): step 1 shows Cancel + Continue
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue/i }),
    ).toBeInTheDocument();
  });

  // Regression for OP-213: the API answers snake_case (global_prefix) while the
  // wizard's submit guard reads camelCase (globalPrefix), so before the load
  // boundary normalized the shape every Save Changes failed with "Please enter
  // an environment name and global prefix".
  it("saves an environment loaded from the snake_case API shape", async () => {
    const onUpdateEnvironment = vi.fn().mockResolvedValue({ id: "env-001" });
    renderWizardEdit(onUpdateEnvironment);

    // Edit mode opens on step 2 (services); Save Changes lives on the last step.
    expect(await screen.findByText("Edit Environment")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Step 2 of/)).toBeInTheDocument(),
    );
    let save = screen.queryByRole("button", { name: /Save Changes/i });
    while (!save) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: /Continue/i }) ||
            screen.queryByRole("button", { name: /Save Changes/i }),
        ).toBeInTheDocument(),
      );
      save = screen.queryByRole("button", { name: /Save Changes/i });
    }

    fireEvent.click(save);

    await waitFor(() => expect(onUpdateEnvironment).toHaveBeenCalledTimes(1));
    const submitted = onUpdateEnvironment.mock.calls[0][0];
    expect(submitted).toMatchObject({
      id: "env-001",
      name: "demo-prod",
      globalPrefix: "op-",
    });
    // Orphaned chart keys never reach the save payload.
    expect(Object.keys(submitted.services.eks.helmCharts)).not.toContain(
      "thanos",
    );
  });

  it("offers no way back to the immutable basic-configuration step in edit mode", async () => {
    renderWizardEdit(vi.fn());

    expect(await screen.findByText("Edit Environment")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Step 2 of/)).toBeInTheDocument(),
    );

    // Sidebar step 1 is visible but disabled, and Previous is disabled on step 2.
    expect(
      screen.getByText("Basic Configuration").closest("button"),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
  });
});
