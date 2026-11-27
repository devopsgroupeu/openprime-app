import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import CloudCredentialsTab from "../CloudCredentialsTab";

const credential = {
  id: "cred-001",
  name: "aws-sandbox",
  provider: "aws",
  identifier: "123456789012",
};

function renderTab(props = {}) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        {/* The app shell provides the tooltips. */}
        <TooltipProvider>
          <CloudCredentialsTab
            credentials={[credential]}
            onAddCredential={() => {}}
            onEditCredential={() => {}}
            onDeleteCredential={() => {}}
            {...props}
          />
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("CloudCredentialsTab", () => {
  it("shows a success toast when credentials are valid", async () => {
    server.use(
      http.post("*/cloud-credentials/:id/test", () =>
        HttpResponse.json({
          valid: true,
          accountId: "123456789012",
          arn: "arn:aws:iam::123456789012:user/test",
          message: "Credentials are valid",
          lastValidated: "2026-01-01T00:00:00Z",
        }),
      ),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Credentials valid for account 123456789012/),
      ).toBeInTheDocument(),
    );
  });

  it("shows a warning toast when the tested account ID mismatches", async () => {
    server.use(
      http.post("*/cloud-credentials/:id/test", () =>
        HttpResponse.json({
          valid: true,
          accountId: "999999999999",
          accountIdMismatch: true,
          arn: "arn:aws:iam::999999999999:user/test",
          message: "Credentials are valid",
          lastValidated: "2026-01-01T00:00:00Z",
        }),
      ),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Credentials are valid, but they belong to account/i),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/999999999999.*123456789012.*Update the Account ID/i),
    ).toBeInTheDocument();
  });

  it("shows a 'not available yet' warning when the endpoint returns 404", async () => {
    server.use(
      http.post(
        "*/cloud-credentials/:id/test",
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Credential testing isn't available yet/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows an error toast when credentials are invalid", async () => {
    server.use(
      http.post("*/cloud-credentials/:id/test", () =>
        HttpResponse.json({
          valid: false,
          reason: "invalid_credentials",
          message: "Access denied",
        }),
      ),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    await waitFor(() =>
      expect(screen.getByText(/Credentials invalid/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Access denied/)).toBeInTheDocument();
  });

  it("asks to check the connection when the test request fails", async () => {
    server.use(
      http.post("*/cloud-credentials/:id/test", () => HttpResponse.error()),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    expect(
      await screen.findByText(
        "Couldn't test aws-sandbox. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a warning toast for temporary failures", async () => {
    server.use(
      http.post("*/cloud-credentials/:id/test", () =>
        HttpResponse.json({
          valid: false,
          reason: "network_error",
          message: "STS unreachable",
        }),
      ),
    );

    renderTab();
    fireEvent.click(screen.getByRole("button", { name: /Test/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Could not verify credentials/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/STS unreachable/)).toBeInTheDocument();
  });
});
