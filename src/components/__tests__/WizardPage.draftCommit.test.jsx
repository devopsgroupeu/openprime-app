import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import WizardPage from "../WizardPage";
import { saveDraft, loadDraftCommit } from "../../utils/wizardDraft";

// OP-208: a restored draft was filled in against one version of the catalog.
// With the runtime catalog on, the field set moves when the TEMPLATES move, so
// a draft can predate what the wizard now renders. The user is told; the draft
// is kept untouched.

const CATALOG = { status: "ready", commit: "new-commit", retry: vi.fn() };

vi.mock("../../contexts/CatalogContext", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useCatalog: () => CATALOG };
});

const WARNING = /started against an earlier version of the service catalog/i;

// AuthProvider auto-authenticates in mock mode as src/mocks/fixtures.js currentUser;
// that id namespaces the draft key, so tests must write under the same one.
const USER_ID = "mock-user-1";

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

const draft = () => ({
  name: "half-finished",
  provider: "aws",
  region: "eu-west-1",
  services: {},
  helmCharts: {},
});

describe("WizardPage — stale draft warning", () => {
  beforeEach(() => {
    localStorage.clear();
    CATALOG.commit = "new-commit";
  });
  afterEach(() => localStorage.clear());

  it("warns when the restored draft predates the current catalog", async () => {
    saveDraft(USER_ID, draft(), { commit: "old-commit" });
    renderWizard();
    await waitFor(() => expect(screen.getByText(WARNING)).toBeInTheDocument());
  });

  it("REGRESSION: the stamp is read during render, before the save effect overwrites it", async () => {
    // The draft-saving effect is declared FIRST and therefore runs first,
    // re-stamping the draft with the current commit. Reading the stored commit
    // inside the warning effect would always compare equal and the warning
    // would never fire — which is exactly what happened in the first draft of
    // this change. The assertion below is what catches it.
    saveDraft(USER_ID, draft(), { commit: "old-commit" });
    renderWizard();

    await waitFor(() => expect(screen.getByText(WARNING)).toBeInTheDocument());

    // And the side effect that makes the warning non-repeating: by now the save
    // effect has re-stamped the draft to the current commit.
    await waitFor(() => expect(loadDraftCommit(USER_ID)).toBe("new-commit"));
  });

  it("stays silent when the draft matches the current catalog", async () => {
    saveDraft(USER_ID, draft(), { commit: "new-commit" });
    renderWizard();
    await waitFor(() =>
      expect(screen.getByText(/Create Environment|Basic/i)).toBeTruthy(),
    );
    expect(screen.queryByText(WARNING)).toBeNull();
  });

  it("stays silent for an unstamped draft — cannot tell is not a mismatch", async () => {
    // Drafts already in customers' browsers, and every draft written with the
    // runtime catalog off, carry no stamp. Warning on those would nag everyone.
    saveDraft(USER_ID, draft());
    renderWizard();
    await waitFor(() =>
      expect(screen.getByText(/Create Environment|Basic/i)).toBeTruthy(),
    );
    expect(screen.queryByText(WARNING)).toBeNull();
  });

  it("stays silent when there is no catalog at all — the flag-off case", async () => {
    CATALOG.commit = null;
    saveDraft(USER_ID, draft(), { commit: "old-commit" });
    renderWizard();
    await waitFor(() =>
      expect(screen.getByText(/Create Environment|Basic/i)).toBeTruthy(),
    );
    expect(screen.queryByText(WARNING)).toBeNull();
  });

  it("keeps the draft rather than discarding it", async () => {
    // The whole point: a stale draft is still the user's work. Losing a
    // half-finished environment is worse than a field having moved.
    saveDraft(USER_ID, draft(), { commit: "old-commit" });
    renderWizard();
    await waitFor(() => expect(screen.getByText(WARNING)).toBeInTheDocument());
    expect(screen.getByDisplayValue("half-finished")).toBeInTheDocument();
  });
});
