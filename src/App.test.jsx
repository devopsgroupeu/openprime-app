import { render, screen } from "@testing-library/react";
import App from "./App";

// In mock mode (vitest runs with VITE_MOCK=true) the app auto-authenticates via
// the mock AuthProvider and loads its data from MSW — no real Keycloak/backend.
test("renders the authenticated app with mocked environments", async () => {
  render(<App />);

  // The app reaches the authenticated state and renders the mocked environments.
  expect(
    await screen.findByText(/demo-prod/i, {}, { timeout: 3000 }),
  ).toBeInTheDocument();
});
