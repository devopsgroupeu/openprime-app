import { delay, http, HttpResponse } from "msw";
import { environments, credentials, currentUser } from "./fixtures";

// Wildcard origins (`*/...`) so handlers match regardless of the configured API base URL.
import catalog from "./catalog.json";

const MOCK_ANSWER =
  '(mock answer) One NAT gateway per availability zone keeps private subnets online when a zone fails. A single shared gateway costs less, which is fine for development.\n\n```json\n{"natGateway": "ONE_PER_AZ"}\n```';

// The environments as the backend's database would have them: the fixtures,
// then what the session created, edited and deleted and what finished jobs
// stored on them (jobService.persistOutcome and the lifecycle status). The
// list reloads whenever it opens, so it must read them back. Kept until a
// reload; tests reset it.
let stored = environments;
let created = 0;
export const resetMockState = () => {
  stored = environments;
  created = 0;
};
const findStored = (id) => stored.find((env) => env.id === id);
const store = (env) => {
  stored = stored.map((e) => (e.id === env.id ? env : e));
  return env;
};

// The wizard writes camelCase; the API answers snake_case and never sends the
// deploy key back, only whether one is set (Environment.toJSON).
const SNAKE = {
  globalPrefix: "global_prefix",
  terraformBackend: "terraform_backend",
  gitRepository: "git_repository",
  cloudCredentialId: "cloud_credential_id",
  stateKey: "state_key",
};
const asStored = (body) =>
  Object.fromEntries(
    Object.entries(body).map(([key, value]) => {
      if (key !== "gitRepository" || !value) return [SNAKE[key] ?? key, value];
      const { sshKey, ...git } = value;
      const keySet = Boolean(sshKey?.trim() || git.sshKeyConfigured);
      return ["git_repository", { ...git, sshKeyConfigured: keySet }];
    }),
  );

// Job ids carry their kind and environment: job-<kind>-<environment id>.
const jobOf = (jobId) => {
  const [, kind, environmentId] =
    /^job-(generate|push)-(.+)$/.exec(jobId) ?? [];
  return { kind: kind ?? "generate", environmentId };
};

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
    HttpResponse.json({ preferences: currentUser.preferences }),
  ),
  http.put("*/users/me/profile", async ({ request }) =>
    HttpResponse.json({ ...currentUser, ...(await request.json()) }),
  ),
  http.put("*/users/me/preferences", async ({ request }) =>
    HttpResponse.json({
      ...currentUser.preferences,
      ...(await request.json()),
    }),
  ),

  // --- Environments ---
  http.get("*/environments", () => HttpResponse.json(stored)),
  http.get("*/environments/:id", ({ params }) => {
    const env = findStored(params.id);
    return env
      ? HttpResponse.json(env)
      : new HttpResponse(null, { status: 404 });
  }),
  http.post("*/environments", async ({ request }) => {
    created += 1;
    const now = new Date().toISOString();
    const env = {
      ...asStored(await request.json()),
      id: `env-new-${created}`,
      status: "pending",
      created_at: now,
      updated_at: now,
    };
    stored = [env, ...stored];
    return HttpResponse.json(env, { status: 201 });
  }),
  http.put("*/environments/:id", async ({ request, params }) => {
    const env = findStored(params.id);
    if (!env) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(
      store({
        ...env,
        ...asStored(await request.json()),
        id: env.id,
        updated_at: new Date().toISOString(),
      }),
    );
  }),
  http.delete("*/environments/:id", ({ params }) => {
    stored = stored.filter((env) => env.id !== params.id);
    return HttpResponse.json({ success: true });
  }),
  // Shaped like the backend's 201: the bucket name under `data`.
  http.post("*/environments/terraform-backend/create", async ({ request }) => {
    const { environmentName, region, cloudCredentialId } = await request.json();
    const account = credentials.find(
      (c) => c.id === cloudCredentialId,
    )?.identifier;
    return HttpResponse.json(
      {
        success: true,
        data: { bucketName: `${account}-terraform-${environmentName}`, region },
      },
      { status: 201 },
    );
  }),
  // Async job model: enqueue returns 202 + jobId, UI polls /jobs/:jobId,
  // then downloads the artifact for generate jobs.
  http.post("*/environments/:id/generate", ({ params }) =>
    HttpResponse.json(
      {
        jobId: `job-generate-${params.id}`,
        type: "generate",
        status: "queued",
      },
      { status: 202 },
    ),
  ),
  http.post("*/environments/:id/push", ({ params }) =>
    HttpResponse.json(
      { jobId: `job-push-${params.id}`, type: "push", status: "queued" },
      { status: 202 },
    ),
  ),
  http.get("*/jobs/:jobId", ({ params }) => {
    const { kind, environmentId } = jobOf(String(params.jobId));
    const isPush = kind === "push";
    const env = findStored(environmentId);
    if (env) {
      const now = new Date().toISOString();
      store({
        ...env,
        status: "running",
        [`last_${kind}_at`]: now,
        [`last_${kind}_status`]: "succeeded",
        [`last_${kind}_error`]: null,
        updated_at: now,
      });
    }
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
  http.get("*/cloud-credentials", () => HttpResponse.json({ credentials })),
  // Same envelope as the backend: the edit dialog reads `credential`.
  http.get("*/cloud-credentials/:id", ({ params }) =>
    HttpResponse.json({
      credential: credentials.find((c) => c.id === params.id) || credentials[0],
    }),
  ),
  // Same shape as the backend: the environments that use this credential.
  http.get("*/cloud-credentials/:id/usage", ({ params }) => {
    const users = stored
      .filter((env) => env.cloud_credential_id === params.id)
      .map(({ id, name }) => ({ id, name }));
    return HttpResponse.json({ count: users.length, environments: users });
  }),
  http.post("*/cloud-credentials", async ({ request }) =>
    HttpResponse.json(
      { id: "cred-new", ...(await request.json()) },
      { status: 201 },
    ),
  ),
  http.put("*/cloud-credentials/:id", async ({ request, params }) =>
    HttpResponse.json({ id: params.id, ...(await request.json()) }),
  ),
  http.delete("*/cloud-credentials/:id", () =>
    HttpResponse.json({ success: true }),
  ),

  // --- AI assistant ---
  // Streams like the backend: server-sent events with text chunks, then done.
  http.post("*/ai/chat", async () => {
    await delay(800);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of MOCK_ANSWER.match(/.{1,24}/gs)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`),
          );
          await delay(40);
        }
        controller.enqueue(encoder.encode('data: {"done":true}\n\n'));
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
];
