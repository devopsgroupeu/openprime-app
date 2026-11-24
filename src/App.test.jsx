import { render, screen, fireEvent, within } from "@testing-library/react";
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

test("renders the shell and opens the command palette with Cmd+K", async () => {
  render(<App />);
  await screen.findByText(/demo-prod/i, {}, { timeout: 3000 });

  // Shell: sidebar nav + top bar breadcrumb
  const sidebar = document.querySelector('[data-slot="sidebar"]');
  expect(
    within(sidebar).getByRole("link", { name: "Environments" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    within(screen.getByRole("navigation", { name: "breadcrumb" })).getByText(
      "Environments",
    ),
  ).toBeInTheDocument();

  fireEvent.keyDown(document, { key: "k", metaKey: true });

  const palette = await screen.findByRole("dialog");
  expect(
    within(palette).getByPlaceholderText("Search environments or jump to..."),
  ).toBeInTheDocument();
  // Environments come from the already-loaded list
  expect(within(palette).getByText("demo-prod")).toBeInTheDocument();
  expect(within(palette).getByText("Add AWS credentials")).toBeInTheDocument();
});
