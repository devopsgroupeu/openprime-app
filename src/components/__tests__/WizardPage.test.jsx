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

// Create mode with a caller-supplied onCreateEnvironment, so the submitted
// payload can be asserted.
function renderWizardCreate(onCreateEnvironment) {
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
                    onCreateEnvironment={onCreateEnvironment}
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

  // Inverted for OP-244. Step 1 used to be sealed off in edit mode because it
  // was wholly read-only. It no longer is: it carries the domain field, which is
  // editable on purpose so a customer who delegates a domain later does not have
  // to recreate the environment. Sealing the step would put that field out of
  // reach — the lock now lives on the two fields that actually need it.
  it("lets edit mode reach the basic-configuration step, where only name and prefix are locked", async () => {
    renderWizardEdit(vi.fn());

    expect(await screen.findByText("Edit Environment")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Step 2 of/)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Previous/i }));
    await waitFor(() =>
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument(),
    );

    expect(screen.getByPlaceholderText(/e\.g\., production/)).toBeDisabled();
    expect(screen.getByPlaceholderText("e.g., example.com")).not.toBeDisabled();
  });

  // The create payload is an explicit whitelist, so a new field renders,
  // validates and reviews correctly while being dropped on the way out.
  it("sends the domain in the create payload", async () => {
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-new" });
    renderWizardCreate(onCreateEnvironment);

    expect(await screen.findByText("Environment Name")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., production/), {
      target: { value: "prod" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., example.com"), {
      target: { value: "example.com" },
    });

    let create = screen.queryByRole("button", { name: /Create Environment/i });
    while (!create) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: /Continue/i }) ||
            screen.queryByRole("button", { name: /Create Environment/i }),
        ).toBeInTheDocument(),
      );
      create = screen.queryByRole("button", { name: /Create Environment/i });
    }

    fireEvent.click(create);
    await waitFor(() => expect(onCreateEnvironment).toHaveBeenCalledTimes(1));
    expect(onCreateEnvironment.mock.calls[0][0].domain).toBe("example.com");
  });
});
