import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { OnboardingProvider } from "../../contexts/OnboardingContext";
import WizardPage from "../WizardPage";
import { generateSshKeyPair } from "../../utils/sshKeyPair";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";

vi.mock("../../utils/sshKeyPair", () => ({ generateSshKeyPair: vi.fn() }));

// The wizard opened while the setup guide (OP-283) is running: the MSW
// fixtures give the account a saved AWS key and no environments, so the guide
// is before "Describe your environment" is done.

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderWizard({ onCreateEnvironment, guided }) {
  const wizard = (
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
      <Route path="*" element={<LocationProbe />} />
    </Routes>
  );
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/environments/create"]}>
            {guided ? (
              <OnboardingProvider environments={[]}>
                {wizard}
              </OnboardingProvider>
            ) : (
              wizard
            )}
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

async function createEnvironment() {
  fireEvent.change(await screen.findByPlaceholderText(/e\.g\., production/), {
    target: { value: "guided" },
  });
  for (let step = 0; step < 3; step += 1) {
    const next = screen.queryByRole("button", { name: /Continue/i });
    if (!next) break;
    fireEvent.click(next);
  }
  fireEvent.click(screen.getByRole("button", { name: /Create Environment/i }));
}

describe("WizardPage in the setup guide", () => {
  beforeEach(() => {
    localStorage.clear();
    generateSshKeyPair.mockResolvedValue({
      privateKey: "guided-private-key",
      publicKey: "ssh-ed25519 guided-public-key",
    });
  });

  it("switches the repository section on and generates the deploy key", async () => {
    renderWizard({ onCreateEnvironment: vi.fn(), guided: true });

    expect(
      await screen.findByPlaceholderText(
        "git@github.com:organization/repository.git",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByRole("tab", { name: "Auto" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByText("This generated key is selected for saving."),
    ).toBeInTheDocument();
    // The guide sits where the wizard's own progress box was.
    expect(screen.queryByText("Overall Progress")).not.toBeInTheDocument();
  });

  it("fills in the repository address pasted into the guide in step 2", async () => {
    server.use(
      http.get("*/users/me/preferences", () =>
        HttpResponse.json({
          preferences: {
            onboarding: { repoUrl: "git@github.com:acme/infra.git" },
          },
        }),
      ),
    );
    renderWizard({ onCreateEnvironment: vi.fn(), guided: true });

    expect(
      await screen.findByDisplayValue("git@github.com:acme/infra.git"),
    ).toBeInTheDocument();
  });

  it("goes to the new environment after Create, where the push step is", async () => {
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-9" });
    renderWizard({ onCreateEnvironment, guided: true });

    await createEnvironment();

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/environments/env-9",
      ),
    );
  });

  it("without the guide, leaves the repository off and returns to the list", async () => {
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-9" });
    renderWizard({ onCreateEnvironment, guided: false });

    await screen.findByText("Environment Name");
    expect(
      screen.queryByPlaceholderText(
        "git@github.com:organization/repository.git",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Overall Progress")).toBeInTheDocument();

    await createEnvironment();

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        /^\/environments$/,
      ),
    );
  });
});
