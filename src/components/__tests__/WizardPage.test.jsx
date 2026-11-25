import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { vi } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import WizardPage from "../WizardPage";
import { generateSshKeyPair } from "../../utils/sshKeyPair";

vi.mock("../../utils/sshKeyPair", () => ({ generateSshKeyPair: vi.fn() }));

// WizardPage is a full page: it needs Theme (toasts)/Auth, Toast, Tooltip (the
// app root provides it) and a router (useParams/useNavigate). In mock mode
// AuthProvider auto-authenticates. The two plain routes show where Cancel goes.
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
                <Route path="/environments/create" element={wizard} />
                <Route path="/environments/:id/edit" element={wizard} />
                <Route path="/environments" element={<p>Environment list</p>} />
                <Route
                  path="/environments/:id"
                  element={<p>Environment detail</p>}
                />
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
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Auto" }));
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

  it("leaves create mode on Cancel and says the draft is kept", async () => {
    localStorage.clear();
    renderWizardCreate(vi.fn());
    await stepHeading("Basics");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment list")).toBeInTheDocument();
    expect(
      screen.getByText("Draft saved. Resume it from New environment."),
    ).toBeInTheDocument();
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

  it("leaves edit mode without asking when nothing changed", async () => {
    renderWizardEdit(vi.fn());
    await stepHeading("Services");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Environment detail")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).toBeNull();
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
