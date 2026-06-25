import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import authService from "../../services/authService";
import { isMockMode } from "../../utils/mockMode";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

// Demonstrates the FE test harness: tests run with mock mode on, MSW serving
// the backend API, and Keycloak bypassed — no real backend/DB/Keycloak needed.

describe("FE mock harness", () => {
  it("runs in mock mode", () => {
    expect(isMockMode()).toBe(true);
  });

  it("serves mocked environments via MSW (no real backend)", async () => {
    const envs = await authService.get("/environments");
    expect(envs).toHaveLength(2);
    expect(envs.map((e) => e.name)).toContain("demo-prod");
  });

  it("serves the mocked current user", async () => {
    const user = await authService.get("/users/me");
    expect(user.username).toBe("mockuser");
  });

  it("auto-authenticates as the mock user (Keycloak bypassed)", async () => {
    function WhoAmI() {
      const { isAuthenticated, user } = useAuth();
      return <div>{isAuthenticated ? `Hello ${user.username}` : "anonymous"}</div>;
    }

    render(
      <AuthProvider>
        <WhoAmI />
      </AuthProvider>,
    );

    expect(await screen.findByText("Hello mockuser")).toBeInTheDocument();
  });
});
