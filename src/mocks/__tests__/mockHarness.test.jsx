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
    expect(envs).toHaveLength(3);
    expect(envs.map((e) => e.name)).toContain("demo-prod");
  });

  it("reports credential usage from the mocked environments", async () => {
    expect(await authService.get("/cloud-credentials/cred-002/usage")).toEqual({
      count: 1,
      environments: [{ id: "env-003", name: "analytics-dev" }],
    });
    expect(await authService.get("/cloud-credentials/cred-new/usage")).toEqual({
      count: 0,
      environments: [],
    });
  });

  // Mock mode is clicked through like the real app: the list reloads when it
  // opens, so what the session wrote has to be there.
  it("keeps the environments the session creates, edits and deletes", async () => {
    const created = await authService.post("/environments", {
      name: "sandbox",
      globalPrefix: "sb-",
      provider: "aws",
      region: "eu-central-1",
      gitRepository: { enabled: true, url: "git@x:y.git", sshKey: "secret" },
      cloudCredentialId: "cred-001",
    });
    // The backend's shape: snake_case, the deploy key never sent back.
    expect(created).toMatchObject({
      global_prefix: "sb-",
      cloud_credential_id: "cred-001",
      git_repository: { url: "git@x:y.git", sshKeyConfigured: true },
    });
    expect(JSON.stringify(created)).not.toContain("secret");
    const names = async () =>
      (await authService.get("/environments")).map((e) => e.name);
    expect(await names()).toContain("sandbox");

    await authService.put(`/environments/${created.id}`, {
      ...created,
      region: "eu-west-1",
    });
    expect(await authService.get(`/environments/${created.id}`)).toMatchObject({
      name: "sandbox",
      region: "eu-west-1",
    });

    await authService.delete("/environments/env-002");
    await authService.delete(`/environments/${created.id}`);
    expect(await names()).toEqual(["demo-prod", "analytics-dev"]);
    await expect(
      authService.get(`/environments/${created.id}`),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("starts every test from the fixtures", async () => {
    expect(await authService.get("/environments")).toHaveLength(3);
  });

  it("serves the mocked current user", async () => {
    const user = await authService.get("/users/me");
    expect(user.username).toBe("mockuser");
  });

  it("auto-authenticates as the mock user (Keycloak bypassed)", async () => {
    function WhoAmI() {
      const { isAuthenticated, user } = useAuth();
      return (
        <div>{isAuthenticated ? `Hello ${user.username}` : "anonymous"}</div>
      );
    }

    render(
      <AuthProvider>
        <WhoAmI />
      </AuthProvider>,
    );

    expect(await screen.findByText("Hello mockuser")).toBeInTheDocument();
  });
});
