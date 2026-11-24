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

  it("takes an existing repository on the user's word and moves on", async () => {
    serve({ credentials: KEY });
    renderDock();

    const dock = await findDock();
    fireEvent.click(
      within(dock).getByRole("button", { name: "I have a repository" }),
    );

    expect(
      await within(dock).findByRole("heading", {
        name: "Step 3: Describe your environment",
      }),
    ).toBeInTheDocument();
    expect(within(dock).getByRole("status")).toHaveTextContent(
      "Repository ready.",
    );
    expect(saved).toEqual([{ onboarding: { ownRepo: true } }]);
  });

  it("reads its ticks and its collapsed state from the account", async () => {
    serve({ credentials: KEY, onboarding: { ownRepo: true, collapsed: true } });
    renderDock();

    const pill = await screen.findByRole("button", {
      name: /Step 3 of 5 · Describe your environment/,
    });
    fireEvent.click(pill);

    expect(await findDock()).toBeInTheDocument();
    expect(saved).toEqual([
      { onboarding: { ownRepo: true, collapsed: false } },
    ]);
  });

  it("in the wizard, says which part the user is in and what is next", async () => {
    serve({ credentials: KEY, onboarding: { ownRepo: true } });
    renderDock({
      path: "/environments/create",
      page: (
        <WizardProbe
          wizard={{
            part: 1,
            partCount: 3,
            partTitle: "Basic Configuration",
            name: "prod",
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

  it("sends the user back when the next field is in an earlier part", async () => {
    serve({ credentials: KEY, onboarding: { ownRepo: true } });
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
