// OP-217: a Keycloak outage used to render "Session expired. Redirecting to
// login..." under a spinner that never resolved — the app could not tell an
// unreachable identity service from a signed-out user.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import keycloak from "../../config/keycloak";
import { AuthProvider, useAuth } from "../AuthContext";

// A minimal consumer: the states we care about are the context's, not any
// particular page's rendering of them.
function Probe() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();
  if (isLoading) return <p>loading</p>;
  if (authError) return <button onClick={retryAuth}>retry</button>;
  return <p>{isAuthenticated ? "authenticated" : "anonymous"}</p>;
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  // vite.config.mjs forces VITE_MOCK=true for the whole suite, which makes
  // AuthProvider skip Keycloak entirely. These tests are specifically about the
  // real Keycloak path, so mock mode has to be off for them.
  vi.stubEnv("VITE_MOCK", "false");
  keycloak.subject = "user-1";
  keycloak.tokenParsed = {
    preferred_username: "tester",
    realm_access: { roles: [] },
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Keycloak outage", () => {
  it("surfaces an error state instead of reporting the user as signed out", async () => {
    vi.spyOn(keycloak, "init").mockRejectedValue(new Error("network down"));

    renderProbe();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "retry" })).toBeInTheDocument(),
    );
    // The distinction that matters: not rendered as "anonymous", which is what
    // drove the false "Session expired" screen.
    expect(screen.queryByText("anonymous")).not.toBeInTheDocument();
  });

  it("recovers when Keycloak comes back, without a page reload", async () => {
    let call = 0;
    const init = vi.spyOn(keycloak, "init").mockImplementation(() => {
      call += 1;
      // First attempt fails, everything after it succeeds — the retry must not
      // depend on exactly how many times React runs the effect.
      return call === 1
        ? Promise.reject(new Error("network down"))
        : Promise.resolve(true);
    });

    renderProbe();
    const retry = await screen.findByRole("button", { name: "retry" });

    await act(async () => {
      fireEvent.click(retry);
    });

    await waitFor(() =>
      expect(screen.getByText("authenticated")).toBeInTheDocument(),
    );
    // The claim is "retry re-attempts and recovers", not a render count.
    expect(init.mock.calls.length).toBeGreaterThan(1);
  });

  it("reports a genuine unauthenticated result as anonymous, not as an error", async () => {
    // init resolving false is "not signed in" — a different thing from the
    // service being unreachable, and it must not show the outage screen.
    vi.spyOn(keycloak, "init").mockResolvedValue(false);

    renderProbe();

    await waitFor(() =>
      expect(screen.getByText("anonymous")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "retry" }),
    ).not.toBeInTheDocument();
  });
});
