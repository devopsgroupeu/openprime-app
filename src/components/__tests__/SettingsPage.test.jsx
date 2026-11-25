import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { server } from "../../mocks/server";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { guardedNavigate } from "@/components/shared/save-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import SettingsPage from "../SettingsPage";

// The tab nav moved to the settings sidebar (see AppSidebar.test.jsx); the
// page now reads its tab from the URL. The app shell provides the tooltips.
function renderSettingsPage(path = "/settings/account", state, nav = null) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[{ pathname: path, state }]}>
              {nav}
              <Routes>
                <Route path="/settings/:tab" element={<SettingsPage />} />
                <Route path="/environments" element={<p>Environments</p>} />
              </Routes>
            </MemoryRouter>
          </TooltipProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("SettingsPage", () => {
  it("renders the settings chrome and account tab", async () => {
    renderSettingsPage("/settings/account");

    // Header
    expect(
      await screen.findByRole("heading", { level: 1, name: "Account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your name and email as shown in OpenPrime."),
    ).toBeInTheDocument();

    // Account form loaded from MSW fixtures
    expect(await screen.findByLabelText(/First Name/i)).toHaveValue("Mock");
    expect(screen.getByLabelText(/Last Name/i)).toHaveValue("User");
    expect(screen.getByLabelText(/Email/i)).toHaveValue("mock@openprime.dev");

    // The save bar appears only once something changed.
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "Mocka" },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("saves the profile and preferences from the save bar", async () => {
    const puts = {};
    server.use(
      http.put("*/users/me/profile", async ({ request }) => {
        puts.profile = await request.json();
        return HttpResponse.json(puts.profile);
      }),
      http.put("*/users/me/preferences", async ({ request }) => {
        puts.preferences = await request.json();
        return HttpResponse.json(puts.preferences);
      }),
    );
    renderSettingsPage("/settings/account");

    fireEvent.change(await screen.findByLabelText(/Last Name/i), {
      target: { value: "Person" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(puts.profile).toEqual({
      firstName: "Mock",
      lastName: "Person",
      email: "mock@openprime.dev",
    });
    expect(puts.preferences).toMatchObject({
      defaultProvider: "aws",
      defaultRegion: "eu-west-1",
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Save" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("asks to check the connection when the save request fails", async () => {
    server.use(http.put("*/users/me/profile", () => HttpResponse.error()));
    renderSettingsPage("/settings/account");

    fireEvent.change(await screen.findByLabelText(/Last Name/i), {
      target: { value: "Person" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "Couldn't save your changes. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Unsaved changes" }),
    ).toBeInTheDocument();
  });

  it("checks the account form before it saves", async () => {
    const puts = [];
    server.use(
      http.put("*/users/me/profile", async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({});
      }),
      http.put("*/users/me/preferences", async ({ request }) => {
        puts.push(await request.json());
        return HttpResponse.json({});
      }),
    );
    renderSettingsPage("/settings/account");

    const email = await screen.findByLabelText(/Email/i);
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: " " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const firstName = screen.getByLabelText(/First Name/i);
    expect(firstName).toHaveAttribute("aria-invalid", "true");
    expect(firstName).toHaveAccessibleDescription("Enter your first name.");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    expect(screen.getByLabelText(/Last Name/i)).not.toHaveAttribute(
      "aria-invalid",
    );
    await waitFor(() => expect(firstName).toHaveFocus());
    expect(
      screen.getByRole("region", { name: "Unsaved changes" }),
    ).toBeInTheDocument();

    // Fixed: the errors go and the next Save is the first request.
    fireEvent.change(firstName, { target: { value: "Mocka" } });
    fireEvent.change(email, { target: { value: "mocka@openprime.dev" } });
    expect(email).not.toHaveAttribute("aria-invalid");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(puts).toHaveLength(2);
    expect(puts[0]).toEqual({
      firstName: "Mocka",
      lastName: "User",
      email: "mocka@openprime.dev",
    });
  });

  it("goes back to the account form when Save finds a problem there", async () => {
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <Link to="/settings/preferences">To preferences</Link>
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/Email/i), {
      target: { value: "mock@" },
    });
    fireEvent.click(screen.getByRole("link", { name: "To preferences" }));
    await screen.findByLabelText(/Default Cloud Provider/i);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const email = await screen.findByLabelText(/Email/i);
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    await waitFor(() => expect(email).toHaveFocus());
  });

  it("saves preferences next to an untouched profile without names", async () => {
    server.use(
      http.get("*/users/me", () =>
        HttpResponse.json({ email: "mock@openprime.dev" }),
      ),
    );
    renderSettingsPage("/settings/preferences");

    fireEvent.change(await screen.findByLabelText(/Default Region/i), {
      target: { value: "eu-central-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
  });

  it("discards unsaved changes", async () => {
    renderSettingsPage("/settings/account");

    const firstName = await screen.findByLabelText(/First Name/i);
    fireEvent.change(firstName, { target: { value: "Mocka" } });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(firstName).toHaveValue("Mock");
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  });

  it("asks before leaving with unsaved changes and drops them on discard", async () => {
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <Link to="/environments">To environments</Link>
        <Link to="/settings/account">To account</Link>
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/First Name/i), {
      target: { value: "Mocka" },
    });
    fireEvent.click(screen.getByRole("link", { name: "To environments" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Discard changes" }),
    );

    expect(await screen.findByText("Environments")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "To account" }));
    expect(await screen.findByLabelText(/First Name/i)).toHaveValue("Mock");
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  });

  it("keeps both drafts across the settings tabs and saves them together", async () => {
    const puts = {};
    server.use(
      http.put("*/users/me/profile", async ({ request }) => {
        puts.profile = await request.json();
        return HttpResponse.json(puts.profile);
      }),
      http.put("*/users/me/preferences", async ({ request }) => {
        puts.preferences = await request.json();
        return HttpResponse.json(puts.preferences);
      }),
    );
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <Link to="/settings/preferences">To preferences</Link>
        <Link to="/settings/account">To account</Link>
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/Last Name/i), {
      target: { value: "Person" },
    });
    // No prompt between settings tabs: the account edit stays.
    fireEvent.click(screen.getByRole("link", { name: "To preferences" }));
    fireEvent.change(await screen.findByLabelText(/Default Region/i), {
      target: { value: "eu-central-1" },
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(puts.profile).toEqual({
      firstName: "Mock",
      lastName: "Person",
      email: "mock@openprime.dev",
    });
    expect(puts.preferences).toMatchObject({ defaultRegion: "eu-central-1" });
    expect(
      screen.queryByRole("region", { name: "Unsaved changes" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "To account" }));
    expect(await screen.findByLabelText(/Last Name/i)).toHaveValue("Person");
    expect(
      screen.queryByRole("region", { name: "Unsaved changes" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the save bar and the leave guard on the credentials tab", async () => {
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <Link to="/settings/cloud-credentials">To credentials</Link>
        <Link to="/environments">To environments</Link>
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/First Name/i), {
      target: { value: "Mocka" },
    });
    fireEvent.click(screen.getByRole("link", { name: "To credentials" }));

    expect(await screen.findByText("aws-sandbox")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Unsaved changes" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "To environments" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("does not ask when the palette moves between settings tabs", async () => {
    function PaletteJump({ to }) {
      const navigate = useNavigate();
      return (
        <button
          type="button"
          onClick={() => guardedNavigate(() => navigate(to), to)}
        >
          {`Jump to ${to}`}
        </button>
      );
    }
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <PaletteJump to="/settings/preferences" />
        <PaletteJump to="/environments" />
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/First Name/i), {
      target: { value: "Mocka" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Jump to /settings/preferences" }),
    );

    expect(
      await screen.findByLabelText(/Default Cloud Provider/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Unsaved changes" }),
    ).toBeInTheDocument();
    // Leaving settings still asks.
    fireEvent.click(
      screen.getByRole("button", { name: "Jump to /environments" }),
    );
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows the saved values after a tab change while saving", async () => {
    let release;
    server.use(
      http.put("*/users/me/profile", async ({ request }) => {
        const body = await request.json();
        await new Promise((resolve) => {
          release = resolve;
        });
        return HttpResponse.json(body);
      }),
    );
    renderSettingsPage(
      "/settings/account",
      undefined,
      <nav>
        <Link to="/settings/preferences">To preferences</Link>
        <Link to="/settings/account">To account</Link>
      </nav>,
    );

    fireEvent.change(await screen.findByLabelText(/First Name/i), {
      target: { value: "Mocka" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(release).toBeDefined());
    // Away and back while the PUT is still in flight.
    fireEvent.click(screen.getByRole("link", { name: "To preferences" }));
    await screen.findByLabelText(/Default Cloud Provider/i);
    fireEvent.click(screen.getByRole("link", { name: "To account" }));
    await screen.findByLabelText(/First Name/i);
    release();

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toHaveValue("Mocka");
    expect(
      screen.queryByRole("region", { name: "Unsaved changes" }),
    ).not.toBeInTheDocument();
  });

  it("keeps what is typed while the save is in flight", async () => {
    let release;
    server.use(
      http.put("*/users/me/profile", async ({ request }) => {
        const body = await request.json();
        await new Promise((resolve) => {
          release = resolve;
        });
        return HttpResponse.json(body);
      }),
    );
    renderSettingsPage("/settings/account");

    const firstName = await screen.findByLabelText(/First Name/i);
    fireEvent.change(firstName, { target: { value: "Mocka" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(release).toBeDefined());
    fireEvent.change(firstName, { target: { value: "Mockab" } });
    release();

    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(firstName).toHaveValue("Mockab");
    expect(
      screen.getByRole("region", { name: "Unsaved changes" }),
    ).toBeInTheDocument();
  });

  it("shows a retry when the settings fail to load", async () => {
    server.use(
      http.get("*/users/me", () => new HttpResponse(null, { status: 500 })),
    );
    renderSettingsPage("/settings/account");

    expect(
      await screen.findByText("Couldn't load your settings."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("shows the preferences tab at /settings/preferences", async () => {
    renderSettingsPage("/settings/preferences");

    expect(
      await screen.findByLabelText(/Default Cloud Provider/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Region/i)).toBeInTheDocument();

    // Save appears once a preference changed
    fireEvent.change(screen.getByLabelText(/Default Region/i), {
      target: { value: "eu-central-1" },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("shows the credentials tab at /settings/cloud-credentials", async () => {
    renderSettingsPage("/settings/cloud-credentials");

    expect(await screen.findByText("AWS credentials")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add credentials/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("aws-sandbox")).toBeInTheDocument();

    // No save bar on the credentials tab
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Save" }),
      ).not.toBeInTheDocument(),
    );
  });

  // The shared copy button: in-view "Copied" feedback, like everywhere else.
  it("copies a credential's account ID with the shared copy button", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderSettingsPage("/settings/cloud-credentials");

    const [copy] = await screen.findAllByRole("button", {
      name: "Copy account ID",
    });
    fireEvent.click(copy);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("123456789012"));
    expect(
      await screen.findByRole("button", { name: "Copied" }),
    ).toBeInTheDocument();
  });

  it("shows one add action in the empty state when there are no credentials", async () => {
    server.use(
      http.get("*/cloud-credentials", () =>
        HttpResponse.json({ credentials: [] }),
      ),
    );
    renderSettingsPage("/settings/cloud-credentials");

    expect(await screen.findByText("No AWS credentials")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Add credentials/i }),
    ).toHaveLength(1);
  });

  it("opens the add credential dialog when navigated to with addCredential", async () => {
    renderSettingsPage("/settings/cloud-credentials", { addCredential: true });

    expect(await screen.findByText("AWS credentials")).toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("deletes a credential after the usage check and confirmation", async () => {
    let deleted = null;
    server.use(
      http.delete("*/cloud-credentials/:id", ({ params }) => {
        deleted = params.id;
        return HttpResponse.json({ success: true });
      }),
    );
    renderSettingsPage("/settings/cloud-credentials");

    fireEvent.pointerDown(
      await screen.findByRole("button", {
        name: "More actions for aws-sandbox",
      }),
      { button: 0, ctrlKey: false },
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/This credential is used by 1 environment\./),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Deleted aws-sandbox.")).toBeInTheDocument();
    expect(deleted).toBe("cred-001");
  });

  const openCredentialMenu = async (name) =>
    fireEvent.pointerDown(
      await screen.findByRole("button", { name: `More actions for ${name}` }),
      { button: 0, ctrlKey: false },
    );

  it("toasts a failed credential delete and keeps the credential", async () => {
    server.use(
      http.delete("*/cloud-credentials/:id", () =>
        HttpResponse.json({ error: "Credential is locked" }, { status: 409 }),
      ),
    );
    renderSettingsPage("/settings/cloud-credentials");

    await openCredentialMenu("aws-sandbox");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "Couldn't delete aws-sandbox: Credential is locked",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Credential is locked/)).toBeInTheDocument();
    expect(screen.getByText("aws-sandbox")).toBeInTheDocument();
  });

  it("retries loading the credentials after a failure", async () => {
    server.use(
      http.get(
        "*/cloud-credentials",
        () => new HttpResponse(null, { status: 500 }),
        { once: true },
      ),
    );
    renderSettingsPage("/settings/cloud-credentials");

    expect(
      await screen.findByText("Couldn't load your cloud credentials."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("aws-sandbox")).toBeInTheDocument();
  });

  it("toasts when a credential cannot be loaded for editing", async () => {
    server.use(
      http.get(
        "*/cloud-credentials/:id",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    renderSettingsPage("/settings/cloud-credentials");

    await openCredentialMenu("aws-sandbox");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(
      await screen.findByText("Couldn't load aws-sandbox. Try again."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
