import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// Mock Keycloak
vi.mock("keycloak-js", () => {
  return {
    default: vi.fn(() => ({
      init: vi.fn(() => Promise.resolve(false)),
      authenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      refreshToken: null,
      idToken: null,
      tokenParsed: null,
      refreshTokenParsed: null,
      idTokenParsed: null,
      updateToken: vi.fn(() => Promise.resolve(false)),
    })),
  };
});

test("renders OpenPrime application loading state", async () => {
  render(<App />);

  // Initially should show authentication loading state
  expect(screen.getByText(/Initializing authentication/i)).toBeInTheDocument();

  // Wait for authentication to complete
  await waitFor(
    () => {
      expect(screen.queryByText(/Initializing authentication/i)).not.toBeInTheDocument();
    },
    { timeout: 3000 },
  );
});
