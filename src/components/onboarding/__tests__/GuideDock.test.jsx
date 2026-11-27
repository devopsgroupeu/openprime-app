import { useEffect } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import {
  OnboardingProvider,
  useOnboarding,
} from "../../../contexts/OnboardingContext";
import GuideDock from "../GuideDock";

const REPO = "git@github.com:acme/infra.git";
const KEY = [{ id: "cred-1", provider: "aws" }];

// What the account holds, and every preferences save the guide makes.
let saved;
function serve({ credentials = [], onboarding } = {}) {
  saved = [];
  server.use(
    http.get("*/cloud-credentials", () => HttpResponse.json({ credentials })),
    http.get("*/users/me/preferences", () =>
      HttpResponse.json({
        preferences: onboarding ? { theme: "dark", onboarding } : {},
      }),
    ),
    http.put("*/users/me/preferences", async ({ request }) => {
      const body = await request.json();
      saved.push(body);
      return HttpResponse.json({ preferences: body });
    }),
  );
}

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

// Stands in for the wizard: reports its progress the way WizardPage does.
function WizardProbe({ wizard }) {
  const setWizard = useOnboarding().setWizard;
  useEffect(() => setWizard(wizard), [setWizard, wizard]);
  return null;
}

function renderDock({
  environments = [],
  path = "/environments",
  available = true,
  page = null,
} = {}) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <OnboardingProvider environments={environments} available={available}>
            <Routes>
              <Route
                path="*"
                element={
                  <>
                    {page}
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
            <GuideDock />
          </OnboardingProvider>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>,
  );
}

const findDock = () =>
  screen.findByRole("complementary", { name: "Setup guide" });
const currentPoint = (dock) =>
  within(dock)
    .getAllByRole("listitem")
    .find(
      (item) =>
        item.getAttribute("aria-current") === "step" &&
        !item.querySelector("ol"),
    );

describe("GuideDock", () => {
  it("starts a new user at connecting AWS, with nothing done", async () => {
    serve();
    renderDock();

    const dock = await findDock();
    expect(
      within(dock).getByRole("heading", {
        name: "Step 1: Connect your AWS account",
      }),
    ).toBeInTheDocument();
    expect(dock).toHaveTextContent("0 of 5 done");
  });

  it("opens the AWS dialog itself and follows its three parts", async () => {
    serve();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    renderDock();

    fireEvent.click(
      within(await findDock()).getByRole("button", { name: "Connect AWS" }),
    );
    const dock = await findDock();
    await waitFor(() =>
      expect(currentPoint(dock)).toHaveTextContent("Open the AWS terminal"),
    );

    fireEvent.click(screen.getByRole("button", { name: /Copy command/ }));
    await waitFor(() =>
      expect(currentPoint(dock)).toHaveTextContent("Paste the line it prints"),
    );
  });

  it("ticks steps from real data and saves the deployment tick in the account", async () => {
    serve({ credentials: KEY });
    renderDock({
      environments: [
        {
          id: "env-1",
          git_repository: { url: REPO },
          last_push_status: "succeeded",
        },
      ],
    });

    const dock = await findDock();
    expect(dock).toHaveTextContent("4 of 5 done");
    fireEvent.click(within(dock).getByRole("button", { name: "Mark as done" }));

    await waitFor(() =>
      expect(saved).toEqual([{ onboarding: { deployed: true } }]),
    );
    expect(
      screen.queryByRole("complementary", { name: "Setup guide" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("Your first environment is set up."),
    ).toBeInTheDocument();
  });

  // The dead end reported on 2026-11-24: the repository was created on
  // GitHub and nothing in the guide said how to move on.
  it("carries the AWS key connected in step 1 over to the deployment step", async () => {
    const credentials = [];
    serve();
    server.use(
      http.get("*/cloud-credentials", () => HttpResponse.json({ credentials })),
      http.post("*/cloud-credentials", async ({ request }) => {
        const body = await request.json();
        credentials.push({ id: "cred-1", name: body.name, provider: "aws" });
        return HttpResponse.json(credentials[0], { status: 201 });
      }),
    );
    renderDock({
      environments: [
        {
          id: "env-1",
          git_repository: { url: REPO },
          last_push_status: "succeeded",
        },
      ],
    });

    fireEvent.click(
      within(await findDock()).getByRole("button", { name: "Connect AWS" }),
    );
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

    fireEvent.click(
      await within(await findDock()).findByRole("button", {
        name: "Show me how",
      }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Start the deployment",
    });
    expect(
      within(dialog).getByText(/The AWS key from step 1 is filled in below/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("AKIAIOSFODNN7EXAMPLE"),
    ).toBeInTheDocument();
  });

  it("walks the deployment in a dialog and finishes the guide from there", async () => {
    serve({ credentials: KEY });
    renderDock({
      environments: [
        {
          id: "env-1",
          git_repository: { url: REPO },
          last_push_status: "succeeded",
        },
      ],
    });

    fireEvent.click(
      within(await findDock()).getByRole("button", { name: "Show me how" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Start the deployment",
    });
    expect(
      within(dialog).getByRole("link", { name: /Open Terraform Deployment/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/actions/workflows/terraform-deploy.yml",
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Both approved, done" }),
    );

    await waitFor(() =>
      expect(saved).toEqual([{ onboarding: { deployed: true } }]),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: "Setup guide" }),
    ).not.toBeInTheDocument();
  });

  it("moves on once the new repository's address is pasted", async () => {
    serve({ credentials: KEY });
    renderDock();

    const dock = await findDock();
    fireEvent.change(
      within(dock).getByLabelText(
        /Created it\? Paste the address from your browser/,
      ),
      { target: { value: "https://github.com/acme/infra" } },
    );
    fireEvent.click(within(dock).getByRole("button", { name: "Continue" }));

    expect(
      await within(dock).findByRole("heading", {
        name: "Step 3: Describe your environment",
      }),
    ).toBeInTheDocument();
    expect(within(dock).getByRole("status")).toHaveTextContent(
      "Repository ready.",
    );
    expect(saved).toEqual([{ onboarding: { repoUrl: REPO } }]);
  });

  it("says what to copy when the pasted text is not an address", async () => {
    serve({ credentials: KEY });
    renderDock();

    const dock = await findDock();
    fireEvent.change(
      within(dock).getByLabelText(
        /Created it\? Paste the address from your browser/,
      ),
      { target: { value: "infra" } },
    );
    fireEvent.click(within(dock).getByRole("button", { name: "Continue" }));

    expect(within(dock).getByRole("alert")).toHaveTextContent(
      "That is not a repository address.",
    );
    expect(
      within(dock).getByRole("heading", {
        name: "Step 2: Create an empty repository on GitHub",
      }),
    ).toBeInTheDocument();
    expect(saved).toEqual([]);
  });

  it("reads its ticks and its collapsed state from the account", async () => {
    serve({ credentials: KEY, onboarding: { repoUrl: REPO, collapsed: true } });
    renderDock();

    const pill = await screen.findByRole("button", {
      name: /Step 3 of 5 · Describe your environment/,
    });
    fireEvent.click(pill);

    expect(await findDock()).toBeInTheDocument();
    expect(saved).toEqual([
      { onboarding: { repoUrl: REPO, collapsed: false } },
    ]);
  });

  it("in the wizard, says which part the user is in and what is next", async () => {
    serve({ credentials: KEY, onboarding: { repoUrl: REPO } });
    renderDock({
      path: "/environments/create",
      page: (
        <WizardProbe
          wizard={{
            part: 1,
            partCount: 3,
            partTitle: "Basic Configuration",
            name: "prod",
            backendReady: true,
            repoUrl: "",
          }}
        />
      ),
    });

    const dock = await findDock();
    expect(
      await within(dock).findByText(
        "One form in 3 parts. You are in part 1: Basic Configuration.",
      ),
    ).toBeInTheDocument();
    expect(currentPoint(dock)).toHaveTextContent(
      "Paste your repository address",
    );
    expect(
      within(dock).queryByRole("button", { name: "Create environment" }),
    ).not.toBeInTheDocument();
  });

  it("after the key is copied, links to the repository's deploy keys page", async () => {
    serve({ credentials: KEY, onboarding: { repoUrl: REPO } });
    renderDock({
      path: "/environments/create",
      page: (
        <WizardProbe
          wizard={{
            part: 1,
            partCount: 3,
            partTitle: "Basic Configuration",
            name: "prod",
            backendReady: true,
            repoUrl: REPO,
            keyCopied: true,
          }}
        />
      ),
    });

    const dock = await findDock();
    await waitFor(() =>
      expect(currentPoint(dock)).toHaveTextContent("Add it on GitHub"),
    );
    const link = within(dock).getByRole("link", { name: "Open deploy keys" });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/settings/keys/new",
    );
    // Without write access every push is refused.
    expect(within(dock).getByText("Tick Allow write access.")).toBeVisible();

    fireEvent.click(link);

    await waitFor(() =>
      expect(currentPoint(dock)).toHaveTextContent("Click Create Environment"),
    );
    // Still there if the tab was closed by mistake.
    expect(
      within(dock).getByRole("link", { name: "Open again" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/settings/keys/new",
    );
  });

  it("sends the user back when the next field is in an earlier part", async () => {
    serve({ credentials: KEY, onboarding: { repoUrl: REPO } });
    renderDock({
      path: "/environments/create",
      page: (
        <WizardProbe
          wizard={{
            part: 2,
            partCount: 3,
            partTitle: "Services Configuration",
            name: "prod",
            repoUrl: "",
          }}
        />
      ),
    });

    expect(
      await screen.findByText(
        "This is in part 1 of the form. Go back with Previous.",
      ),
    ).toBeInTheDocument();
  });

  it("leads to the environment to push, and there points at Push to Git", async () => {
    serve({ credentials: KEY });
    const environments = [
      { id: "env-1", git_repository: { url: REPO }, last_push_status: null },
    ];
    renderDock({ environments });

    fireEvent.click(
      within(await findDock()).getByRole("button", {
        name: "Open environment",
      }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/environments/env-1",
    );
    await waitFor(() =>
      expect(currentPoint(screen.getByRole("complementary"))).toHaveTextContent(
        "Click Push to Git",
      ),
    );
  });

  it("shows where to click on request and goes quiet again on Escape", async () => {
    serve({ credentials: KEY });
    const environments = [
      { id: "env-1", git_repository: { url: REPO }, last_push_status: null },
    ];
    // jsdom lays nothing out, so the target reports a size of its own.
    const placed = (element) => {
      if (element) {
        element.getBoundingClientRect = () => ({
          left: 900,
          top: 120,
          width: 150,
          height: 44,
          right: 1050,
          bottom: 164,
        });
      }
    };
    renderDock({
      environments,
      path: "/environments/env-1",
      page: (
        <button type="button" data-guide="push-button" ref={placed}>
          Push to Git
        </button>
      ),
    });

    const show = await within(await findDock()).findByRole("button", {
      name: "Show me where",
    });
    await waitFor(() => expect(show).toBeEnabled());
    fireEvent.click(show);

    const callout = await screen.findByRole("dialog", {
      name: "Click Push to Git",
    });
    expect(callout).toHaveTextContent(
      "OpenPrime writes the code and sends it to your repository.",
    );
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("cannot show a field that is not on the page", async () => {
    serve({ credentials: KEY });
    renderDock({
      environments: [
        { id: "env-1", git_repository: { url: REPO }, last_push_status: null },
      ],
      path: "/environments/env-1",
    });

    expect(
      await within(await findDock()).findByRole("button", {
        name: "Show me where",
      }),
    ).toBeDisabled();
  });

  it("stays away while the environment list failed to load", async () => {
    serve();
    renderDock({ available: false });

    await waitFor(() => expect(saved).toEqual([]));
    expect(
      screen.queryByRole("complementary", { name: "Setup guide" }),
    ).not.toBeInTheDocument();
  });
});
