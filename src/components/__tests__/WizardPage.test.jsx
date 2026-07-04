import { render, screen } from "@testing-library/react";
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
});
