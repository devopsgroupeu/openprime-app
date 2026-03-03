import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

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
