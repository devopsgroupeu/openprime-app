import { http, HttpResponse } from "msw";
import { environments, credentials, currentUser } from "./fixtures";

// Wildcard origins (`*/...`) so handlers match regardless of the configured API base URL.
import catalog from "./catalog.json";

// Walkthrough mode: open the app with ?mock=empty to start with no environments
// and no credentials and keep whatever you create (sessionStorage, so a reload
// keeps it and ?mock=empty starts over). It exists to walk the onboarding guide
// end to end. Without the flag the fixtures are served exactly as before.
const WALKTHROUGH_KEY = "openprime-mock-walkthrough";
const walkthrough = (() => {
  if (typeof window === "undefined") return null;
  try {
    if (new URLSearchParams(window.location.search).get("mock") === "empty") {
      const fresh = {
        environments: [],
        credentials: [],
        preferences: {},
        seq: 0,
      };
      sessionStorage.setItem(WALKTHROUGH_KEY, JSON.stringify(fresh));
      // Start over once. Left in the address, any reload (the dev server
      // reloads on every code change) would wipe what was created since.
      const url = new URL(window.location.href);
      url.searchParams.delete("mock");
      window.history.replaceState(window.history.state, "", url);
      return fresh;
    }
    const saved = sessionStorage.getItem(WALKTHROUGH_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();
const saveWalkthrough = () => {
  try {
    sessionStorage.setItem(WALKTHROUGH_KEY, JSON.stringify(walkthrough));
  } catch {
    // Storage blocked: the walkthrough still works until the next reload.
  }
};
const envList = () => (walkthrough ? walkthrough.environments : environments);

// A repository the way the API sends it back: never the deploy key, but
// whether one is set and its fingerprint (backend utils/sshKey.js). A blank key
// on an update keeps the stored one, as on the server.
const mockFingerprint = (key) => {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `SHA256:mock${hash.toString(36)}`;
};
const redactGit = (submitted, stored) => {
  if (!submitted) return submitted;
  const {
    sshKey,
    sshKeyConfigured: _c,
    sshKeyFingerprint: _f,
    ...rest
  } = submitted;
  return sshKey?.trim()
    ? {
        ...rest,
        sshKeyConfigured: true,
        sshKeyFingerprint: mockFingerprint(sshKey),
      }
    : {
        ...rest,
        sshKeyConfigured: Boolean(stored?.sshKeyConfigured),
        sshKeyFingerprint: stored?.sshKeyFingerprint ?? null,
      };
};
const credList = () => (walkthrough ? walkthrough.credentials : credentials);
// Stored and merged one level deep like the backend, so the setup guide's
// ticks survive a reload. Outside the walkthrough a copy, so tests in one file
// cannot change the fixture for another.
const fixturePreferences = { ...currentUser.preferences };
const prefs = () =>
  walkthrough ? (walkthrough.preferences ||= {}) : fixturePreferences;
const now = () => new Date().toISOString();

export const handlers = [
  // The real catalog, extracted from the templates repo. Mock mode is the only
  // place the runtime-catalog path can be exercised without a backend, and a
  // hand-written stub would agree with whatever the code does.
  //
  // `window.__e2eCatalog` lets an e2e serve a different document without editing
  // the checked-in fixture, which has to stay parity-clean for `catalog:check`.
  // MSW resolvers run in the page, not in the service worker, so `window` is
  // reachable here.
  //
  // This resolver only ever RUNS in mock mode — `index.jsx` imports ./mocks
  // behind `isMockMode()`. It is still BUNDLED into a production build as a lazy
  // chunk, because a dynamic import is a build-time edge regardless of the
  // runtime guard. Checked, not assumed: a clean `npm run build` emits
  // `assets/browser-*.js` carrying this module, and production serves it.
  http.get("*/catalog", () =>
    HttpResponse.json(
      (typeof window !== "undefined" && window.__e2eCatalog) || catalog,
    ),
  ),

  // --- User ---
  http.get("*/users/me", () => HttpResponse.json(currentUser)),
  http.get("*/users/me/preferences", () =>
    HttpResponse.json({ preferences: prefs() }),
  ),
  http.put("*/users/me/profile", async ({ request }) =>
    HttpResponse.json({ ...currentUser, ...(await request.json()) }),
  ),
  http.put("*/users/me/preferences", async ({ request }) => {
    Object.assign(prefs(), await request.json());
    if (walkthrough) saveWalkthrough();
    return HttpResponse.json({
      message: "Preferences updated successfully",
      preferences: prefs(),
    });
  }),

  // --- Environments ---
  http.get("*/environments", () => HttpResponse.json(envList())),
  http.get("*/environments/:id", ({ params }) => {
    const env = envList().find((e) => e.id === params.id);
    return env
      ? HttpResponse.json(env)
      : new HttpResponse(null, { status: 404 });
  }),
  http.post("*/environments", async ({ request }) => {
    const body = await request.json();
    if (!walkthrough) {
      return HttpResponse.json(
        { id: "env-new", status: "pending", ...body },
        { status: 201 },
      );
    }
    const env = {
      ...body,
      gitRepository: redactGit(body.gitRepository),
      id: `env-${++walkthrough.seq}`,
      status: "pending",
      created_at: now(),
      updated_at: now(),
    };
    walkthrough.environments.unshift(env);
    saveWalkthrough();
    return HttpResponse.json(env, { status: 201 });
  }),
  http.put("*/environments/:id", async ({ request, params }) => {
    const body = await request.json();
    const env = walkthrough?.environments.find((e) => e.id === params.id);
    if (!env) return HttpResponse.json({ id: params.id, ...body });
    Object.assign(env, body, {
      gitRepository: redactGit(body.gitRepository, env.gitRepository),
      id: params.id,
      updated_at: now(),
    });
    saveWalkthrough();
    return HttpResponse.json(env);
  }),
  http.delete("*/environments/:id", ({ params }) => {
    if (walkthrough) {
      walkthrough.environments = walkthrough.environments.filter(
        (e) => e.id !== params.id,
      );
      saveWalkthrough();
    }
    return HttpResponse.json({ success: true });
  }),
  // Shaped like the API's answer: the wizard reads data.bucketName, named
  // <account id>-terraform-<environment> (backend environmentController).
  http.post("*/environments/terraform-backend/create", async ({ request }) => {
    const body = await request.json();
    const cred = credList().find((c) => c.id === body.cloudCredentialId);
    const account = /^\d{12}$/.test(cred?.identifier || "")
      ? cred.identifier
      : "123456789012";
    const name = String(body.environmentName || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    return HttpResponse.json(
      {
        success: true,
        message: "Terraform backend resources created successfully",
        data: {
          bucketName: `${account}-terraform-${name}`,
          region: body.region,
        },
      },
      { status: 201 },
    );
  }),
  // Async job model: enqueue returns 202 + jobId, UI polls /jobs/:jobId,
  // then downloads the artifact for generate jobs.
  http.post("*/environments/:id/generate", () =>
    HttpResponse.json(
      { jobId: "job-gen-1", type: "generate", status: "queued" },
      { status: 202 },
    ),
  ),
  http.post("*/environments/:id/push", ({ params }) => {
    const env = walkthrough?.environments.find((e) => e.id === params.id);
    if (env) {
      Object.assign(env, {
        last_push_status: "succeeded",
        last_push_at: now(),
      });
      saveWalkthrough();
    }
    return HttpResponse.json(
      { jobId: "job-push-1", type: "push", status: "queued" },
      { status: 202 },
    );
  }),
  http.get("*/jobs/:jobId", ({ params }) => {
    const isPush = String(params.jobId).includes("push");
    return HttpResponse.json({
      id: params.jobId,
      type: isPush ? "push" : "generate",
      status: "succeeded",
      attempts: 1,
      maxAttempts: 3,
      result: isPush
        ? { message: "Infrastructure pushed to Git", commit: "abc1234" }
        : {
            message: "Infrastructure generated successfully",
            downloadUrl: `/jobs/${params.jobId}/download`,
          },
      error: null,
    });
  }),
  http.get("*/jobs/:jobId/download", () =>
    HttpResponse.arrayBuffer(
      new TextEncoder().encode("PK\x03\x04 mock-zip").buffer,
      {
        headers: { "Content-Type": "application/zip" },
      },
    ),
  ),

  // --- Cloud credentials ---
  http.get("*/cloud-credentials", () =>
    HttpResponse.json({ credentials: credList() }),
  ),
  // Wrapped like the API's answer; Settings reads response.credential.
  http.get("*/cloud-credentials/:id", ({ params }) =>
    HttpResponse.json({
      credential: credList().find((c) => c.id === params.id) || credList()[0],
    }),
  ),
  http.post("*/cloud-credentials", async ({ request }) => {
    const body = await request.json();
    if (!walkthrough) {
      return HttpResponse.json({ id: "cred-new", ...body }, { status: 201 });
    }
    // Keep only what the list shows: whatever was typed as a secret is not
    // written to sessionStorage.
    const cred = {
      id: `cred-${++walkthrough.seq}`,
      name: body.name,
      provider: body.provider || "aws",
      // The account ID for a guided connect (not a secret); kept so the
      // wizard's bucket preview reads like the real one.
      identifier: body.identifier || "AKIA****MOCK",
      isDefault: Boolean(body.isDefault),
      created_at: now(),
    };
    walkthrough.credentials.push(cred);
    saveWalkthrough();
    return HttpResponse.json(cred, { status: 201 });
  }),
  http.put("*/cloud-credentials/:id", async ({ request, params }) =>
    HttpResponse.json({ id: params.id, ...(await request.json()) }),
  ),
  http.delete("*/cloud-credentials/:id", ({ params }) => {
    if (walkthrough) {
      walkthrough.credentials = walkthrough.credentials.filter(
        (c) => c.id !== params.id,
      );
      saveWalkthrough();
    }
    return HttpResponse.json({ success: true });
  }),

  // --- AI assistant (non-streaming mock) ---
  http.post("*/ai/chat", () =>
    HttpResponse.json({
      message: "(mock AI) This is a mocked assistant response.",
    }),
  ),
];
