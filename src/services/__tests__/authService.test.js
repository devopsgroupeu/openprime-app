// OP-271: the client sent whatever token it held and logged the user out on
// the first 401, so a request made just before expiry ended the session and
// discarded the wizard the user was filling in.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import keycloak from "../../config/keycloak";
import authService from "../authService";

// Records the bearer token of every request; answers 401 to a token the
// "server" no longer accepts.
let seenTokens;
function serveProbe({ acceptedToken }) {
  server.use(
    http.get("*/probe", ({ request }) => {
      const token = request.headers
        .get("Authorization")
        ?.replace("Bearer ", "");
      seenTokens.push(token);
      return token === acceptedToken
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }),
  );
}

beforeEach(() => {
  seenTokens = [];
  keycloak.token = "stale-token";
  keycloak.logout = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authService token handling", () => {
  it("refreshes a token close to expiry before sending the request", async () => {
    keycloak.updateToken = vi.fn(async () => {
      keycloak.token = "fresh-token";
      return true;
    });
    serveProbe({ acceptedToken: "fresh-token" });

    await expect(authService.get("/probe")).resolves.toEqual({ ok: true });

    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
    expect(seenTokens).toEqual(["fresh-token"]);
    expect(keycloak.logout).not.toHaveBeenCalled();
  });

  it("on a 401, forces one refresh and retries instead of logging out", async () => {
    // The token looked valid locally (no pre-request refresh), but the server
    // already rejects it — revoked, or expired in flight.
    keycloak.updateToken = vi.fn(async (minValidity) => {
      if (minValidity !== -1) return false;
      keycloak.token = "fresh-token";
      return true;
    });
    serveProbe({ acceptedToken: "fresh-token" });

    await expect(authService.get("/probe")).resolves.toEqual({ ok: true });

    expect(keycloak.updateToken).toHaveBeenCalledWith(-1);
    expect(seenTokens).toEqual(["stale-token", "fresh-token"]);
    expect(keycloak.logout).not.toHaveBeenCalled();
  });

  it("logs out when the forced refresh fails, without retrying", async () => {
    keycloak.updateToken = vi.fn(async (minValidity) => {
      if (minValidity === -1) throw new Error("refresh token expired");
      return false;
    });
    serveProbe({ acceptedToken: "fresh-token" });

    await expect(authService.get("/probe")).rejects.toMatchObject({
      status: 401,
      message: "Session expired",
    });

    expect(keycloak.logout).toHaveBeenCalledTimes(1);
    expect(seenTokens).toEqual(["stale-token"]);
  });

  it("does not log out when the server rejects even a freshly refreshed token", async () => {
    // The session is fine; the backend refuses this user. Logging out would
    // only send them round a login loop.
    keycloak.updateToken = vi.fn(async (minValidity) => {
      if (minValidity === -1) keycloak.token = "fresh-token";
      return minValidity === -1;
    });
    serveProbe({ acceptedToken: "never" });

    await expect(authService.get("/probe")).rejects.toMatchObject({
      status: 401,
    });

    expect(seenTokens).toEqual(["stale-token", "fresh-token"]);
    expect(keycloak.logout).not.toHaveBeenCalled();
  });

  it("still sends the request when the pre-request refresh fails", async () => {
    // A Keycloak blip must not block a request whose token is still valid;
    // mock mode has no session to refresh at all.
    keycloak.updateToken = vi.fn().mockRejectedValue(new Error("offline"));
    serveProbe({ acceptedToken: "stale-token" });

    await expect(authService.get("/probe")).resolves.toEqual({ ok: true });

    expect(seenTokens).toEqual(["stale-token"]);
    expect(keycloak.logout).not.toHaveBeenCalled();
  });
});
