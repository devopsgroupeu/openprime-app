import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { OnboardingProvider } from "../../contexts/OnboardingContext";
import WizardPage from "../WizardPage";
import GuideDock from "../onboarding/GuideDock";
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

function renderWizard({ onCreateEnvironment, guided, withDock = false }) {
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
                {withDock && <GuideDock />}
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
    // The pipeline needs remote state: the section is on, one click away.
    expect(
      screen.getByRole("button", { name: /Create Backend Resources/ }),
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
    // Next to the generated key: where on GitHub it goes.
    expect(
      await screen.findByRole("link", {
        name: /Open deploy keys for acme\/infra/,
      }),
    ).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/settings/keys/new",
    );
    expect(screen.getByText("Allow write access")).toBeVisible();
  });

  it("chooses the AWS key connected in step 1", async () => {
    renderWizard({ onCreateEnvironment: vi.fn(), guided: true });

    expect(
      await screen.findByDisplayValue("aws-sandbox - AKIA****MOCK"),
    ).toBeInTheDocument();
  });

  // Reported 2026-11-24: AWS connected from the guide while the form was open,
  // and the form kept saying "No saved credentials found".
  it("reads the keys again when AWS is connected from the guide while the form is open", async () => {
    const saved = [];
    server.use(
      http.get("*/cloud-credentials", () =>
        HttpResponse.json({ credentials: saved }),
      ),
      http.post("*/cloud-credentials", async ({ request }) => {
        const body = await request.json();
        const cred = {
          id: "cred-9",
          name: body.name,
          provider: "aws",
          identifier: "AKIA****9999",
          isDefault: body.isDefault,
        };
        saved.push(cred);
        return HttpResponse.json(cred, { status: 201 });
      }),
    );
    renderWizard({
      onCreateEnvironment: vi.fn(),
      guided: true,
      withDock: true,
    });

    expect(
      await screen.findByText("No saved credentials found"),
    ).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Connect AWS" }));
    fireEvent.change(
      await screen.findByPlaceholderText("openprime:123456789012:AKIA…"),
      {
        target: {
          value:
            "openprime:123456789012:AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByDisplayValue(
        "AWS 123456789012 - AKIA****9999 (Default)",
      ),
    ).toBeInTheDocument();
  });

  it("creates the state storage with one click, named after the environment", async () => {
    renderWizard({ onCreateEnvironment: vi.fn(), guided: true });
    fireEvent.change(await screen.findByPlaceholderText(/e\.g\., production/), {
      target: { value: "guided" },
    });
    // The AWS key is chosen on its own (only one saved).
    await screen.findByDisplayValue("aws-sandbox - AKIA****MOCK");

    fireEvent.click(
      screen.getByRole("button", { name: /Create Backend Resources/ }),
    );

    expect(
      await screen.findByText("S3 Bucket: 123456789012-terraform-guided"),
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
    // The only saved key is chosen for every new environment, guide or not.
    expect(
      await screen.findByDisplayValue("aws-sandbox - AKIA****MOCK"),
    ).toBeInTheDocument();

    await createEnvironment();

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        /^\/environments$/,
      ),
    );
  });
});
