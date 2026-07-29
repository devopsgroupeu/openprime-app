import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ToastProvider } from "../../contexts/ToastContext";
import { AuthProvider } from "../../contexts/AuthContext";
import SettingsPage from "../SettingsPage";

// SettingsPage loads user data and credentials via MSW. Mock mode lets
// AuthProvider auto-authenticate so the page can mount fully.
process.env.VITE_MOCK = "true";

function renderSettingsPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("SettingsPage", () => {
  it("renders the settings chrome and account tab", async () => {
    renderSettingsPage();

    // Header
    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your account and platform preferences."),
    ).toBeInTheDocument();

    // Tab nav
    expect(
      screen.getByRole("button", { name: /Account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Preferences/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cloud Credentials/i }),
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

  it("switches to the preferences tab and shows provider/region selects", async () => {
    renderSettingsPage();

    await screen.findByText("Settings");
    fireEvent.click(screen.getByRole("button", { name: /Preferences/i }));

    expect(
      await screen.findByLabelText(/Default Cloud Provider/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Default Region/i)).toBeInTheDocument();

    // Save button still visible
    expect(
      screen.getByRole("button", { name: /Save Changes/i }),
    ).toBeInTheDocument();
  });

  it("switches to the credentials tab and lists AWS credentials", async () => {
    renderSettingsPage();

    await screen.findByText("Settings");
    fireEvent.click(screen.getByRole("button", { name: /Cloud Credentials/i }));

    expect(
      await screen.findByText("AWS Credentials"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("aws-sandbox")).toBeInTheDocument();

    // Save button hidden on credentials tab
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Save Changes/i }),
      ).not.toBeInTheDocument(),
    );
  });
});