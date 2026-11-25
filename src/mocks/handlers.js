import { delay, http, HttpResponse } from "msw";
import { environments, credentials, currentUser } from "./fixtures";

// Wildcard origins (`*/...`) so handlers match regardless of the configured API base URL.
import catalog from "./catalog.json";

const MOCK_ANSWER =
  '(mock answer) One NAT gateway per availability zone keeps private subnets online when a zone fails. A single shared gateway costs less, which is fine for development.\n\n```json\n{"natGateway": "ONE_PER_AZ"}\n```';

// What finished jobs stored on their environment (jobService.persistOutcome
// and the lifecycle status), by environment id, so reading an environment
// after a job shows its outcome. Kept until a reload; tests reset it.
const outcomes = new Map();
export const resetOutcomes = () => outcomes.clear();
const withOutcome = (env) => ({ ...env, ...outcomes.get(env.id) });

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
  http.get("*/environments", () =>
    HttpResponse.json(environments.map(withOutcome)),
  ),
  http.get("*/environments/:id", ({ params }) => {
    const env = environments.find((e) => e.id === params.id);
    return env
      ? HttpResponse.json(withOutcome(env))
      : new HttpResponse(null, { status: 404 });
  }),
  http.post("*/environments", async ({ request }) =>
    HttpResponse.json(
      { id: "env-new", status: "pending", ...(await request.json()) },
      { status: 201 },
    ),
  ),
  http.put("*/environments/:id", async ({ request, params }) =>
    HttpResponse.json({ id: params.id, ...(await request.json()) }),
  ),
  http.delete("*/environments/:id", () => HttpResponse.json({ success: true })),
  http.post("*/environments/terraform-backend/create", () =>
    HttpResponse.json({
      success: true,
      bucket: "mock-tf-state",
      dynamodb_table: "mock-tf-lock",
    }),
  ),
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
    if (environmentId) {
      const now = new Date().toISOString();
      outcomes.set(environmentId, {
        ...outcomes.get(environmentId),
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
    const users = environments
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
