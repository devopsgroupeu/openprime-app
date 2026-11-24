import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import SettingsPage from "../SettingsPage";

// The tab nav moved to the settings sidebar (see AppSidebar.test.jsx); the
// page now reads its tab from the URL.
function renderSettingsPage(path = "/settings/account", state) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[{ pathname: path, state }]}>
            <Routes>
              <Route path="/settings/:tab" element={<SettingsPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("SettingsPage", () => {
  it("renders the settings chrome and account tab", async () => {
    renderSettingsPage("/settings/account");

    // Header
    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your account and platform preferences."),
    ).toBeInTheDocument();

    // Account form loaded from MSW fixtures
    expect(await screen.findByLabelText(/First Name/i)).toHaveValue("Mock");
    expect(screen.getByLabelText(/Last Name/i)).toHaveValue("User");
    expect(screen.getByLabelText(/Email/i)).toHaveValue("mock@openprime.dev");

    // Save button visible on non-credentials tab
    expect(
      screen.getByRole("button", { name: /Save Changes/i }),
    ).toBeInTheDocument();
  });

  it("shows the preferences tab at /settings/preferences", async () => {
    renderSettingsPage("/settings/preferences");

    expect(
      await screen.findByLabelText(/Default Cloud Provider/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Region/i)).toBeInTheDocument();

    // Save button still visible
    expect(
      screen.getByRole("button", { name: /Save Changes/i }),
    ).toBeInTheDocument();
  });

  it("shows the credentials tab at /settings/cloud-credentials", async () => {
    renderSettingsPage("/settings/cloud-credentials");

    expect(await screen.findByText("AWS Credentials")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add/i })).toBeInTheDocument();
    expect(screen.getByText("aws-sandbox")).toBeInTheDocument();

    // Save button hidden on credentials tab
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Save Changes/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens the add credential dialog when navigated to with addCredential", async () => {
    renderSettingsPage("/settings/cloud-credentials", { addCredential: true });

    expect(await screen.findByText("AWS Credentials")).toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
