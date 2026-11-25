import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Routes, Route } from "react-router";
import { afterEach, vi } from "vitest";
import { environments } from "../../mocks/fixtures";
import { server } from "../../mocks/server";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import WizardPage from "../WizardPage";
import AppLayout from "../layout/AppLayout";
import authService from "../../services/authService";
import { generateSshKeyPair } from "../../utils/sshKeyPair";

vi.mock("../../utils/sshKeyPair", () => ({ generateSshKeyPair: vi.fn() }));

// WizardPage is a page of the app shell (AppLayout, as in App): it needs
// Theme (toasts)/Auth, Toast, Tooltip and a router (useParams/useNavigate). In
// mock mode AuthProvider auto-authenticates. The two plain routes show where
// Cancel goes.
function renderAt(path, { onCreateEnvironment, onUpdateEnvironment } = {}) {
  const wizard = (
    <WizardPage
      onCreateEnvironment={onCreateEnvironment ?? vi.fn()}
      onUpdateEnvironment={onUpdateEnvironment ?? vi.fn()}
    />
  );
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<AppLayout environments={environments} />}>
                  <Route path="/environments/create" element={wizard} />
                  <Route path="/environments/:id/edit" element={wizard} />
                  <Route
                    path="/environments"
                    element={<p>Environment list</p>}
                  />
                  <Route
                    path="/environments/:id"
                    element={<p>Environment detail</p>}
                  />
                  <Route path="/settings/:tab" element={<p>Settings</p>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

const renderWizard = () => renderAt("/environments/create");

// Create mode with a caller-supplied onCreateEnvironment, so the submitted
// payload can be asserted.
const renderWizardCreate = (onCreateEnvironment) =>
  renderAt("/environments/create", { onCreateEnvironment });

// Edit mode: MSW serves the snake_case fixture from src/mocks/fixtures.js at
// GET /environments/env-001, exactly as the real API does.
const renderWizardEdit = (onUpdateEnvironment) =>
  renderAt("/environments/env-001/edit", { onUpdateEnvironment });

// The step's h1 names the step the wizard is on.
const stepHeading = (name) => screen.findByRole("heading", { level: 1, name });

describe("WizardPage", () => {
  it("submits the generated private key, never the public key", async () => {
    localStorage.clear();
    const pair = {
      privateKey: "test-private-key-material",
      publicKey: "ssh-rsa test-public-key-material",
    };
    generateSshKeyPair.mockResolvedValue(pair);
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-new" });
    renderWizardCreate(onCreateEnvironment);
    await stepHeading("Basics");
    fireEvent.change(screen.getByPlaceholderText("e.g. production"), {
      target: { value: "key-test" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /git repository/i }));
    fireEvent.change(
      screen.getByPlaceholderText("git@github.com:org/repo.git"),
      {
        target: { value: "git@github.com:example/infra.git" },
      },
    );
    // Radix tabs activate on mouse down.
    fireEvent.mouseDown(
      screen.getByRole("tab", { name: "Generate in browser" }),
    );
    await screen.findByText("This generated key is selected for saving.");
    for (let step = 0; step < 3; step += 1) {
      const next = screen.queryByRole("button", { name: /Continue/i });
      if (!next) break;
      fireEvent.click(next);
    }
    fireEvent.click(
      screen.getByRole("button", { name: /Create Environment/i }),
    );
    await waitFor(() => expect(onCreateEnvironment).toHaveBeenCalledTimes(1));
    const payload = onCreateEnvironment.mock.calls[0][0];
    expect(payload.gitRepository.sshKey).toBe(pair.privateKey);
    expect(payload.gitRepository).not.toHaveProperty("publicKey");
    expect(JSON.stringify(payload)).not.toContain(pair.publicKey);
  });

  it("renders the wizard chrome (top bar, stepper, step content, footer) in create mode", async () => {
    renderWizard();

    // Stepper (WizardStepSidebar + stepDefs); the current step is marked.
    const stepper = await screen.findByRole("navigation", { name: "Steps" });
    expect(within(stepper).getByText("Basics")).toBeInTheDocument();
    expect(within(stepper).getByText("Services")).toBeInTheDocument();
    expect(within(stepper).getByText("Review")).toBeInTheDocument();
    expect(
      within(stepper).getByText("Basics").closest("[aria-current]"),
    ).toHaveAttribute("aria-current", "step");

    // Top bar: breadcrumbs and Cancel.
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByText("New environment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    // The step title is the h1; step-1 content (BasicConfigStep) below it.
    expect(await stepHeading("Basics")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();

    // Footer: no Back on step 1, Continue.
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /Continue/i }),
    ).toBeInTheDocument();
  });

  // The base layout of every signed-in page: the sidebar stays, the shell's
  // top bar names the task, only the content area is the wizard.
  it("renders inside the app shell", async () => {
    renderWizard();
    await stepHeading("Basics");

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(
      within(nav).getByRole("link", { name: "Environments" }),
    ).toHaveAttribute("href", "/environments");
    expect(
      within(nav).getByRole("link", { name: "New environment" }),
    ).toHaveAttribute("aria-current", "page");
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(crumbs).getByRole("link", { name: "Environments" }),
    ).toHaveAttribute("href", "/environments");
    expect(within(crumbs).getByText("New environment")).toHaveAttribute(
      "aria-current",
      "page",
    );
    // One Aura per screen: the wizard's own, no floating launcher.
    expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("names the environment it edits in the shell's breadcrumbs", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");

    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(crumbs).getByRole("link", { name: "demo-prod" }),
    ).toHaveAttribute("href", "/environments/env-001");
    expect(within(crumbs).getByText("Edit")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: "Ask Aura" })).toBeNull();
  });

  it("skips the top bar to the step content, like the app shell", async () => {
    renderWizard();
    await stepHeading("Basics");

    expect(
      screen.getAllByRole("link", { name: "Skip to content" }),
    ).toHaveLength(1);
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    // Focusable, so the skip moves keyboard focus past the top bar.
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toContainElement(
      screen.getByRole("heading", { level: 1, name: "Basics" }),
    );
  });

  it("keeps Continue enabled and points at the first invalid field instead of a toast", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    await stepHeading("Basics");

    const next = screen.getByRole("button", { name: /Continue/i });
    expect(next).toBeEnabled();
    fireEvent.click(next);

    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(
      "Enter a name for this environment.",
    );
    expect(screen.getByLabelText("Resource prefix")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await waitFor(() => expect(name).toHaveFocus());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Basics",
    );
    expect(screen.queryByText(/Validation Error/i)).toBeNull();

    // Fixing the field clears its error.
    fireEvent.change(name, { target: { value: "prod" } });
    expect(name).not.toHaveAttribute("aria-invalid");
  });

  it("flags an emptied Basics step and sends Create back to its fields", async () => {
    localStorage.clear();
    const onCreateEnvironment = vi.fn();
    renderWizardCreate(onCreateEnvironment);
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    const toLastStep = async () => {
      while (!screen.queryByRole("button", { name: /Create environment/i })) {
        fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
        await waitFor(() =>
          expect(
            screen.queryByRole("button", { name: /Continue/i }) ||
              screen.queryByRole("button", { name: /Create environment/i }),
          ).toBeInTheDocument(),
        );
      }
    };
    await toLastStep();

    // Back to Basics through the stepper, empty the name, jump forward again.
    const stepper = screen.getByRole("navigation", { name: "Steps" });
    fireEvent.click(within(stepper).getByRole("button", { name: /Basics/ }));
    await stepHeading("Basics");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.click(within(stepper).getByRole("button", { name: /Services/ }));
    await stepHeading("Services");
    expect(within(stepper).getByText("Needs attention")).toBeInTheDocument();

    await toLastStep();
    fireEvent.click(
      screen.getByRole("button", { name: /Create environment/i }),
    );

    await stepHeading("Basics");
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
    expect(onCreateEnvironment).not.toHaveBeenCalled();
  });

  // The switch states intent, so its empty required field blocks Continue.
  it("treats a switched-on git repository without a URL as a Basics error", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /git repository/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    const url = screen.getByLabelText("Repository URL");
    expect(url).toHaveAttribute("aria-invalid", "true");
    expect(url).toHaveAccessibleDescription(
      "Enter the repository URL or switch this off.",
    );
    await waitFor(() => expect(url).toHaveFocus());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Basics",
    );

    fireEvent.change(url, {
      target: { value: "git@github.com:example/infra.git" },
    });
    expect(url).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Services");
  });

  it("treats a switched-on state backend without a bucket as a Basics error", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /state backend/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    const toggle = screen.getByRole("switch", { name: /state backend/i });
    expect(toggle).toHaveAttribute("aria-invalid", "true");
    expect(toggle).toHaveAccessibleDescription(
      "Add a state bucket or switch this off.",
    );
    await waitFor(() => expect(toggle).toHaveFocus());

    fireEvent.click(screen.getByRole("radio", { name: /existing bucket/ }));
    const bucket = screen.getByLabelText("Bucket name");
    expect(bucket).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(bucket, { target: { value: "acme-tf-state" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Services");
  });

  it("lets Continue on once the state backend is created", async () => {
    localStorage.clear();
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-new" });
    renderWizardCreate(onCreateEnvironment);
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.change(await screen.findByLabelText("Credentials (optional)"), {
      target: { value: "cred-001" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /state backend/i }));
    fireEvent.click(screen.getByRole("button", { name: "Create backend" }));
    expect(await screen.findByText("Backend created.")).toBeInTheDocument();

    for (let step = 0; step < 3; step += 1) {
      const next = screen.queryByRole("button", { name: /Continue/i });
      if (!next) break;
      fireEvent.click(next);
    }
    fireEvent.click(
      await screen.findByRole("button", { name: /Create environment/i }),
    );
    await waitFor(() => expect(onCreateEnvironment).toHaveBeenCalledTimes(1));
    expect(onCreateEnvironment.mock.calls[0][0].terraformBackend).toMatchObject(
      { enabled: true, bucketName: "123456789012-terraform-prod" },
    );
  });

  // One Basics error list: the domain gates Continue and Create like the rest.
  it("holds an invalid domain on Basics and sends Create back to it", async () => {
    localStorage.clear();
    const onCreateEnvironment = vi.fn();
    renderWizardCreate(onCreateEnvironment);
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    const domain = screen.getByPlaceholderText("e.g. example.com");
    fireEvent.change(domain, { target: { value: "localhost" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(domain).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(domain).toHaveFocus());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Basics",
    );

    // Valid, on to Review; then break it again through the stepper.
    fireEvent.change(domain, { target: { value: "example.com" } });
    while (screen.queryByRole("button", { name: /Continue/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    }
    await stepHeading("Review");
    const stepper = screen.getByRole("navigation", { name: "Steps" });
    fireEvent.click(within(stepper).getByRole("button", { name: /Basics/ }));
    await stepHeading("Basics");
    fireEvent.change(screen.getByPlaceholderText("e.g. example.com"), {
      target: { value: "localhost" },
    });
    fireEvent.click(within(stepper).getByRole("button", { name: /Services/ }));
    await stepHeading("Services");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Review");
    expect(within(stepper).getByText("Needs attention")).toBeInTheDocument();
    expect(
      screen.getByText("Basics needs attention.").parentElement,
    ).toHaveTextContent("Domain must be a hostname such as example.com");

    fireEvent.click(
      screen.getByRole("button", { name: /Create environment/i }),
    );
    await stepHeading("Basics");
    await waitFor(() =>
      expect(screen.getByPlaceholderText("e.g. example.com")).toHaveFocus(),
    );
    expect(onCreateEnvironment).not.toHaveBeenCalled();
  });

  it("leaves create mode on Cancel and says the draft is kept", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    await stepHeading("Basics");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "prod" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment list")).toBeInTheDocument();
    expect(
      screen.getByText("Draft saved. Resume it from New environment."),
    ).toBeInTheDocument();
    expect(localStorage.getItem("op-wizard-draft:mock-user-1")).toContain(
      '"name":"prod"',
    );
  });

  // The draft never stores the deploy key (wizardDraft stripSecrets).
  it("says on Cancel that the draft is kept without the deploy key", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    await stepHeading("Basics");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("switch", { name: /git repository/i }));
    fireEvent.change(screen.getByLabelText("SSH private key (deploy key)"), {
      target: { value: "-----BEGIN OPENSSH PRIVATE KEY-----" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment list")).toBeInTheDocument();
    expect(
      screen.getByText("Draft saved without the deploy key."),
    ).toBeInTheDocument();
    expect(localStorage.getItem("op-wizard-draft:mock-user-1")).not.toContain(
      "PRIVATE KEY",
    );
  });

  // Settings > Preferences: the mock user's default region is eu-west-1.
  describe("default region preference", () => {
    const region = () => screen.getByLabelText("Region");
    let get;
    afterEach(() => get?.mockRestore());
    // Resolves once WizardPage has handled the preferences answer: its own
    // .then was attached to the request first, so it has run by then.
    const preferencesRead = async () => {
      const isPreferences = ([path]) => path === "/users/me/preferences";
      await waitFor(() =>
        expect(get.mock.calls.some(isPreferences)).toBe(true),
      );
      const call = get.mock.calls.findIndex(isPreferences);
      await act(() => get.mock.results[call].value);
    };

    it("pre-fills a new wizard, which still keeps no draft", async () => {
      localStorage.clear();
      renderWizardCreate(vi.fn());
      await stepHeading("Basics");
      await waitFor(() => expect(region()).toHaveValue("eu-west-1"));
      expect(screen.queryByText(/Draft saved/)).toBeNull();
      expect(localStorage.getItem("op-wizard-draft:mock-user-1")).toBeNull();
    });

    it("never replaces a region the user already picked", async () => {
      localStorage.clear();
      let answer;
      const answered = new Promise((resolve) => (answer = resolve));
      server.use(
        http.get("*/users/me/preferences", async () => {
          await answered;
          return HttpResponse.json({
            preferences: { defaultRegion: "eu-west-1" },
          });
        }),
      );
      get = vi.spyOn(authService, "get");
      renderWizardCreate(vi.fn());
      await stepHeading("Basics");
      fireEvent.change(region(), { target: { value: "us-west-2" } });
      answer();
      await preferencesRead();
      expect(region()).toHaveValue("us-west-2");
    });

    it("leaves a restored draft as it was", async () => {
      localStorage.clear();
      localStorage.setItem(
        "op-wizard-draft:mock-user-1",
        JSON.stringify({
          name: "half",
          provider: "aws",
          region: "us-east-1",
          services: {},
        }),
      );
      get = vi.spyOn(authService, "get");
      renderWizardCreate(vi.fn());
      await stepHeading("Basics");
      await preferencesRead();
      expect(region()).toHaveValue("us-east-1");
    });
  });

  describe("restored draft", () => {
    const restore = (draft) => {
      localStorage.clear();
      localStorage.setItem(
        "op-wizard-draft:mock-user-1",
        JSON.stringify({
          name: "half",
          globalPrefix: "half-",
          provider: "aws",
          region: "us-east-1",
          ...draft,
        }),
      );
      renderWizardCreate(vi.fn());
    };
    const startOver = () => screen.getByRole("button", { name: "Start over" });

    it("says so and starts over at once when it has no services", async () => {
      restore({ services: {} });
      await stepHeading("Basics");
      expect(screen.getByText("Draft restored")).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toHaveValue("half");

      fireEvent.click(startOver());

      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(screen.getByLabelText("Name")).toHaveValue("");
      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
      expect(screen.queryByRole("button", { name: "Start over" })).toBeNull();
      expect(screen.queryByText("Draft restored")).toBeNull();
      expect(localStorage.getItem("op-wizard-draft:mock-user-1")).toBeNull();
    });

    it("asks first when the draft has enabled services", async () => {
      restore({
        services: { vpc: { enabled: true }, s3: { enabled: true } },
      });
      await stepHeading("Basics");

      fireEvent.click(startOver());
      let dialog = await screen.findByRole("alertdialog", {
        name: "Start over?",
      });
      expect(dialog).toHaveTextContent(
        "The draft is cleared, including its 2 enabled services.",
      );
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Keep draft" }),
      );
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
      expect(screen.getByLabelText("Name")).toHaveValue("half");

      fireEvent.click(startOver());
      dialog = await screen.findByRole("alertdialog");
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Start over" }),
      );
      await waitFor(() =>
        expect(screen.getByLabelText("Name")).toHaveValue(""),
      );
      expect(localStorage.getItem("op-wizard-draft:mock-user-1")).toBeNull();
    });

    it("keeps Start over next to the save time once it changes", async () => {
      restore({ services: {} });
      await stepHeading("Basics");
      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "halfway" },
      });
      expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
      expect(startOver()).toBeInTheDocument();
    });

    it("is not offered on a new wizard", async () => {
      localStorage.clear();
      renderWizardCreate(vi.fn());
      await stepHeading("Basics");
      expect(screen.queryByRole("button", { name: "Start over" })).toBeNull();
    });
  });

  // An untouched wizard is not a draft: nothing is kept, nothing is said.
  it("keeps no draft of an untouched wizard", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    await stepHeading("Basics");
    expect(screen.queryByText(/Draft saved/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "prod" },
    });
    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
    // Typed back to where it started: no draft again.
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    expect(screen.queryByText(/Draft saved/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("Environment list")).toBeInTheDocument();
    expect(screen.queryByText(/Draft saved/)).toBeNull();
    expect(localStorage.getItem("op-wizard-draft:mock-user-1")).toBeNull();
  });

  // Switching git off and on again adds an empty deploy key: no real edit.
  it("leaves edit mode without asking after a net-zero edit", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await stepHeading("Basics");
    const git = screen.getByRole("switch", { name: /git repository/i });
    fireEvent.click(git);
    fireEvent.click(git);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment detail")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("asks before discarding unsaved edits on Cancel", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.change(await screen.findByPlaceholderText("e.g. example.com"), {
      target: { value: "new.example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Discard changes?",
    });
    expect(
      within(dialog).getByText("Your edits to demo-prod will be lost."),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByPlaceholderText("e.g. example.com")).toHaveValue(
      "new.example.com",
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Discard",
      }),
    );
    expect(await screen.findByText("Environment detail")).toBeInTheDocument();
  });

  // Every way out through the shell asks first: links (sidebar, breadcrumbs,
  // user menu) and the palette (guardedNavigate).
  describe("leaving unsaved edits through the shell", () => {
    const editDomain = async () => {
      renderWizardEdit(vi.fn());
      await stepHeading("Services");
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      fireEvent.change(await screen.findByPlaceholderText("e.g. example.com"), {
        target: { value: "new.example.com" },
      });
    };
    const asks = async () => {
      expect(
        await screen.findByRole("alertdialog", { name: "Discard changes?" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Environment list")).toBeNull();
      expect(screen.queryByText("Environment detail")).toBeNull();
      expect(screen.queryByText("Settings")).toBeNull();
    };

    it("asks on a sidebar link", async () => {
      await editDomain();
      fireEvent.click(
        within(
          screen.getByRole("navigation", { name: "Main navigation" }),
        ).getByRole("link", { name: "Environments" }),
      );
      await asks();
    });

    it("asks on a breadcrumb", async () => {
      await editDomain();
      fireEvent.click(
        within(
          screen.getByRole("navigation", { name: "Breadcrumb" }),
        ).getByRole("link", { name: "demo-prod" }),
      );
      await asks();
    });

    it("asks on a palette jump", async () => {
      await editDomain();
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      fireEvent.click(
        within(await screen.findByRole("dialog")).getByRole("option", {
          name: "Environments",
        }),
      );
      await asks();
    });

    it("asks on the user menu's Settings", async () => {
      await editDomain();
      fireEvent.pointerDown(
        screen.getByRole("button", { name: /Account menu/ }),
        { button: 0, ctrlKey: false },
      );
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "Settings" }),
      );
      await asks();
    });

    it("leaves after Discard", async () => {
      await editDomain();
      fireEvent.click(
        within(
          screen.getByRole("navigation", { name: "Main navigation" }),
        ).getByRole("link", { name: "Environments" }),
      );
      fireEvent.click(
        within(await screen.findByRole("alertdialog")).getByRole("button", {
          name: "Discard",
        }),
      );
      expect(await screen.findByText("Environment list")).toBeInTheDocument();
    });
  });

  // Create mode keeps its draft, so the sidebar leaves at once.
  it("leaves create mode through the sidebar without asking", async () => {
    localStorage.clear();
    renderWizard();
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });

    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("link", { name: "Environments" }),
    );

    expect(await screen.findByText("Environment list")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(localStorage.getItem("op-wizard-draft:mock-user-1")).not.toBeNull();
  });

  it("leaves edit mode without asking when nothing changed", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment detail")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("says check and save on the edit stepper", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    const stepper = screen.getByRole("navigation", { name: "Steps" });
    expect(within(stepper).getByText("Check and save")).toBeInTheDocument();
    expect(within(stepper).queryByText("Check and create")).toBeNull();
  });

  it("titles the tab after the task and the saved name", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    expect(document.title).toBe("Edit demo-prod - OpenPrime");
  });

  it("never titles an edit Edit with no name", async () => {
    server.use(
      http.get("*/environments/env-001", () =>
        HttpResponse.json({ ...environments[0], name: "" }),
      ),
    );
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    expect(document.title).toBe("Edit environment - OpenPrime");
  });

  it("remembers that the Aura column was closed", async () => {
    localStorage.clear();
    renderWizard();
    await stepHeading("Basics");
    expect(
      screen.getByRole("complementary", { name: "Aura" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Aura", pressed: true }),
    );

    expect(screen.queryByRole("complementary", { name: "Aura" })).toBeNull();
    expect(localStorage.getItem("op-wizard-aura-open")).toBe("false");
  });

  it("keeps the Aura conversation when the sheet closes and opens again", async () => {
    localStorage.clear();
    // Column closed: the sheet is the only Aura.
    localStorage.setItem("op-wizard-aura-open", "false");
    server.use(
      http.post(
        "*/ai/chat",
        () =>
          new HttpResponse(
            'data: {"chunk":"Use eu-west-1."}\n\ndata: {"done":true}\n\n',
            { headers: { "Content-Type": "text/event-stream" } },
          ),
      ),
    );
    renderWizard();
    await stepHeading("Basics");
    // Below 2xl the top bar's Aura opens the sheet (the column toggle hides).
    const openSheet = () =>
      fireEvent.click(
        screen
          .getAllByRole("button", { name: "Aura" })
          .find((b) => b.getAttribute("aria-haspopup") === "dialog"),
      );

    openSheet();
    const sheet = await screen.findByRole("dialog", { name: "Aura" });
    const input = within(sheet).getByRole("textbox", { name: "Message Aura" });
    fireEvent.change(input, { target: { value: "Which region?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      await within(sheet).findByText("Use eu-west-1."),
    ).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "And for staging?" } });

    // The Escape that ends an IME composition leaves the sheet open.
    fireEvent.keyDown(input, { key: "Escape", isComposing: true });
    expect(screen.getByRole("dialog", { name: "Aura" })).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Aura" })).toBeNull(),
    );

    openSheet();
    const again = await screen.findByRole("dialog", { name: "Aura" });
    expect(within(again).getByText("Which region?")).toBeInTheDocument();
    expect(within(again).getByText("Use eu-west-1.")).toBeInTheDocument();
    expect(
      within(again).getByRole("textbox", { name: "Message Aura" }),
    ).toHaveValue("And for staging?");
  });

  it("keeps a question to Aura about a service when its dialog closes", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    const askAboutVpc = () =>
      fireEvent.click(
        screen.getByRole("button", {
          name: "Ask Aura about Virtual Private Cloud (VPC)",
        }),
      );
    const dialogInput = async () =>
      within(
        await screen.findByRole("dialog", { name: /Ask Aura about/ }),
      ).getByRole("textbox", { name: "Message Aura" });

    askAboutVpc();
    const input = await dialogInput();
    fireEvent.change(input, { target: { value: "Do I need 3 AZs?" } });
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /Ask Aura about/ }),
      ).toBeNull(),
    );

    askAboutVpc();
    expect(await dialogInput()).toHaveValue("Do I need 3 AZs?");
  });

  it("marks a step completed with a check once the user advances past it", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    expect(screen.queryByRole("img", { name: "Completed" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await stepHeading("Services");
    expect(screen.getAllByRole("img", { name: "Completed" })).toHaveLength(1);
  });

  // Regression for OP-213: the API answers snake_case (global_prefix) while the
  // wizard's submit guard reads camelCase (globalPrefix), so before the load
  // boundary normalized the shape every Save Changes failed with "Please enter
  // an environment name and global prefix".
  it("saves an environment loaded from the snake_case API shape", async () => {
    const onUpdateEnvironment = vi.fn().mockResolvedValue({ id: "env-001" });
    renderWizardEdit(onUpdateEnvironment);

    // Edit mode opens on step 2 (services); Save changes lives on the last step.
    await stepHeading("Services");
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

    await stepHeading("Services");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await stepHeading("Basics");

    expect(screen.getByPlaceholderText("e.g. production")).toBeDisabled();
    expect(screen.getByPlaceholderText("e.g. example.com")).not.toBeDisabled();
  });

  // env-001 keeps its state in op-demo-tf-state: show it, never offer to
  // create a second bucket.
  it("shows the existing state bucket in edit mode, with Change for another", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await stepHeading("Basics");

    const section = screen.getByRole("region", {
      name: "Terraform state backend",
    });
    expect(within(section).getByText("op-demo-tf-state")).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Copy bucket name" }),
    ).toBeInTheDocument();
    expect(
      within(section).queryByRole("button", { name: "Create backend" }),
    ).toBeNull();
    expect(within(section).queryByRole("radio")).toBeNull();

    fireEvent.click(within(section).getByRole("button", { name: "Change" }));
    expect(
      within(section).getByRole("radio", { name: /existing bucket/ }),
    ).toBeChecked();
    expect(within(section).getByLabelText("Bucket name")).toHaveValue(
      "op-demo-tf-state",
    );
    expect(within(section).getByLabelText("Bucket name")).toHaveFocus();
  });

  // Ruling: Save holds a switched-on git section without a URL like Create;
  // the recovery is to fill it in or switch it off.
  it("sends Save back to Basics for a switched-on git repository without a URL", async () => {
    server.use(
      http.get("*/environments/env-001", () =>
        HttpResponse.json({
          ...environments[0],
          git_repository: { enabled: true, url: "", branch: "main" },
        }),
      ),
    );
    const onUpdateEnvironment = vi.fn();
    renderWizardEdit(onUpdateEnvironment);
    await stepHeading("Services");
    while (screen.queryByRole("button", { name: /Continue/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    }
    await stepHeading("Review");

    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    await stepHeading("Basics");
    const url = screen.getByLabelText("Repository URL");
    expect(url).toHaveAttribute("aria-invalid", "true");
    expect(url).toHaveAccessibleDescription(
      "Enter the repository URL or switch this off.",
    );
    await waitFor(() => expect(url).toHaveFocus());
    expect(onUpdateEnvironment).not.toHaveBeenCalled();
  });

  it("lists a missing service prerequisite on Review and links to Services", async () => {
    localStorage.clear();
    const onCreateEnvironment = vi.fn();
    renderWizardCreate(onCreateEnvironment);
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Services");
    // EKS on, VPC left off.
    fireEvent.click(
      screen.getByRole("switch", { name: /Enable Elastic Kubernetes/ }),
    );
    while (screen.queryByRole("button", { name: /Continue/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    }
    await stepHeading("Review");

    expect(
      screen.getByText("EKS requires VPC to be enabled"),
    ).toBeInTheDocument();
    // Field-level checks of disabled services are not listed.
    expect(screen.queryByText(/Allow Explicit Index/)).toBeNull();
    // Shown, not gating: Create stays enabled.
    expect(
      screen.getByRole("button", { name: /Create environment/i }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Go to Services" }));
    await stepHeading("Services");
    expect(onCreateEnvironment).not.toHaveBeenCalled();
  });

  it("lists every problem of an enabled service on Review, and only real ones", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Services");
    // Switching it on opens its settings.
    fireEvent.click(
      screen.getByRole("switch", {
        name: "Enable Virtual Private Cloud (VPC)",
      }),
    );
    fireEvent.change(screen.getByLabelText("CIDR Block"), {
      target: { value: "10.0.0" },
    });
    // A numeric option, handed over by the select as text.
    fireEvent.change(screen.getByLabelText("Availability Zones"), {
      target: { value: "3" },
    });
    while (screen.queryByRole("button", { name: /Continue/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    }
    await stepHeading("Review");

    const callout = screen.getByText("Services need attention.").parentElement;
    expect(callout).toHaveTextContent(
      "Virtual Private Cloud (VPC): CIDR Block format is invalid",
    );
    expect(callout).not.toHaveTextContent(/Availability Zones/);
    expect(within(callout).getAllByRole("listitem")).toHaveLength(1);
  });

  it("lets Review's Edit open Basics in edit mode", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");
    while (screen.queryByRole("button", { name: /Continue/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    }
    await stepHeading("Review");

    fireEvent.click(screen.getByRole("button", { name: "Edit basics" }));
    await stepHeading("Basics");
  });

  // Continue turns into Create under the pointer: the second click of a
  // double click must not create the environment.
  it("never creates on the second click of a double click on Continue", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      localStorage.clear();
      const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-new" });
      renderWizardCreate(onCreateEnvironment);
      fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
        target: { value: "prod" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      await stepHeading("Services");

      const primary = screen.getByRole("button", { name: /Continue/i });
      fireEvent.click(primary, { detail: 1 });
      await stepHeading("Review");
      fireEvent.click(
        screen.getByRole("button", { name: /Create environment/i }),
        { detail: 2 },
      );
      await act(() => vi.advanceTimersByTimeAsync(20));
      expect(onCreateEnvironment).not.toHaveBeenCalled();

      // Once Create has shown for a moment, a click creates it, even a quick
      // deliberate second click (detail 2).
      await act(() => vi.advanceTimersByTimeAsync(400));
      fireEvent.click(
        screen.getByRole("button", { name: /Create environment/i }),
        { detail: 2 },
      );
      await waitFor(() => expect(onCreateEnvironment).toHaveBeenCalledTimes(1));
    } finally {
      vi.useRealTimers();
    }
  });

  // The control that had focus often goes away (stepper row, Back, Review's
  // Edit, presets, Clear all): focus lands on the step's h1, never on <body>.
  describe("focus", () => {
    const toServices = async () => {
      localStorage.clear();
      renderWizardCreate(vi.fn());
      fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
        target: { value: "prod" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      return stepHeading("Services");
    };
    // Focuses the control first, as a keyboard user would, then clicks it.
    const press = (button) => {
      button.focus();
      fireEvent.click(button);
    };

    it("moves to the new step's heading on Continue and on Back", async () => {
      const services = await toServices();
      await waitFor(() => expect(services).toHaveFocus());

      press(screen.getByRole("button", { name: "Back" }));
      const basics = await stepHeading("Basics");
      await waitFor(() => expect(basics).toHaveFocus());
      // Back is gone on step 1, focus did not fall to the page.
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    });

    it("moves to the heading of the step a stepper row or Review's Edit opens", async () => {
      await toServices();
      while (screen.queryByRole("button", { name: /Continue/i })) {
        fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      }
      await stepHeading("Review");

      press(screen.getByRole("button", { name: "Edit services" }));
      const services = await stepHeading("Services");
      await waitFor(() => expect(services).toHaveFocus());

      const stepper = screen.getByRole("navigation", { name: "Steps" });
      press(within(stepper).getByRole("button", { name: /Basics/ }));
      const basics = await stepHeading("Basics");
      await waitFor(() => expect(basics).toHaveFocus());
    });

    it("moves to the heading when a preset or Clear all removes itself", async () => {
      const services = await toServices();
      press(screen.getByRole("button", { name: "VPC and EKS" }));
      expect(screen.queryByRole("button", { name: "VPC and EKS" })).toBeNull();
      await waitFor(() => expect(services).toHaveFocus());

      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      const helm = await stepHeading("Helm charts");
      press(screen.getByRole("button", { name: "Monitoring stack" }));
      await waitFor(() =>
        expect(screen.getByText("3 selected")).toBeInTheDocument(),
      );
      await waitFor(() => expect(helm).toHaveFocus());

      press(screen.getByRole("button", { name: "Clear all" }));
      await waitFor(() =>
        expect(screen.getByText("0 selected")).toBeInTheDocument(),
      );
      await waitFor(() => expect(helm).toHaveFocus());
    });

    it("moves to the outcome when Create backend replaces itself", async () => {
      localStorage.clear();
      renderWizardCreate(vi.fn());
      fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
        target: { value: "prod" },
      });
      fireEvent.change(await screen.findByLabelText("Credentials (optional)"), {
        target: { value: "cred-001" },
      });
      fireEvent.click(screen.getByRole("switch", { name: /state backend/i }));

      press(screen.getByRole("button", { name: "Create backend" }));

      const outcome = await screen.findByText("Backend created.");
      await waitFor(() =>
        expect(outcome.closest('[tabindex="-1"]')).toHaveFocus(),
      );
      expect(document.activeElement).toHaveTextContent(
        "Backend created. Bucket 123456789012-terraform-prod",
      );
    });

    // A problem no field shows (a draft without a provider): nothing to
    // point at, so focus stays where it was instead of jumping to the h1.
    it("keeps focus on Continue when no field shows the Basics problem", async () => {
      localStorage.clear();
      localStorage.setItem(
        "op-wizard-draft:mock-user-1",
        JSON.stringify({
          name: "half",
          globalPrefix: "half-",
          provider: "",
          region: "us-east-1",
          services: {},
        }),
      );
      renderWizardCreate(vi.fn());
      const basics = await stepHeading("Basics");

      const next = screen.getByRole("button", { name: /Continue/i });
      press(next);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(basics).toBeInTheDocument();
      expect(next).toHaveFocus();
    });

    it("moves no focus when edit mode opens on Services", async () => {
      renderWizardEdit(vi.fn());
      const services = await stepHeading("Services");
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(services).not.toHaveFocus();
      expect(document.body).toHaveFocus();
    });

    // Create with a Basics problem: the field wins over the heading.
    it("still goes to the first invalid field when Create sends the user back", async () => {
      await toServices();
      fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      await stepHeading("Review");
      const stepper = screen.getByRole("navigation", { name: "Steps" });
      fireEvent.click(within(stepper).getByRole("button", { name: /Basics/ }));
      await stepHeading("Basics");
      fireEvent.change(screen.getByLabelText("Name"), {
        target: { value: "" },
      });
      fireEvent.click(
        within(stepper).getByRole("button", { name: /Services/ }),
      );
      await stepHeading("Services");
      while (screen.queryByRole("button", { name: /Continue/i })) {
        fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
      }
      press(await screen.findByRole("button", { name: /Create environment/i }));

      await stepHeading("Basics");
      await waitFor(() => expect(screen.getByLabelText("Name")).toHaveFocus());
    });
  });

  // Chart values are never stored, so the step offers no editor for them.
  it("offers no values editor on the Helm step and says charts keep their defaults", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    fireEvent.change(await screen.findByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Services");
    fireEvent.click(screen.getByRole("button", { name: "VPC and EKS" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    await stepHeading("Helm charts");

    expect(
      screen.getByText("Charts are generated with their default values."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Monitoring stack" }));
    expect(
      screen.getByRole("switch", { name: "Install Prometheus Stack" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("button", { name: /Custom values/ })).toBeNull();
  });

  // The create payload is an explicit whitelist, so a new field renders,
  // validates and reviews correctly while being dropped on the way out.
  it("sends the domain in the create payload", async () => {
    const onCreateEnvironment = vi.fn().mockResolvedValue({ id: "env-new" });
    renderWizardCreate(onCreateEnvironment);

    await stepHeading("Basics");
    fireEvent.change(screen.getByPlaceholderText("e.g. production"), {
      target: { value: "prod" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. example.com"), {
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
