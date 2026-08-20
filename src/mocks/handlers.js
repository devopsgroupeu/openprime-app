import { http, HttpResponse } from "msw";
import { environments, credentials, currentUser } from "./fixtures";

// Wildcard origins (`*/...`) so handlers match regardless of the configured API base URL.
export const handlers = [
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
  http.get("*/environments", () => HttpResponse.json(environments)),
  http.get("*/environments/:id", ({ params }) => {
    const env = environments.find((e) => e.id === params.id);
    return env
      ? HttpResponse.json(env)
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
  http.post("*/environments/:id/generate", () =>
    HttpResponse.json(
      { jobId: "job-gen-1", type: "generate", status: "queued" },
      { status: 202 },
    ),
  ),
  http.post("*/environments/:id/push", () =>
    HttpResponse.json(
      { jobId: "job-push-1", type: "push", status: "queued" },
      { status: 202 },
    ),
  ),
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
            downloadUrl: `/api/jobs/${params.jobId}/download`,
          },
      error: null,
    });
  }),
  http.get("*/jobs/:jobId/download", () =>
    HttpResponse.arrayBuffer(new TextEncoder().encode("PK\x03\x04 mock-zip").buffer, {
      headers: { "Content-Type": "application/zip" },
    }),
  ),

  // --- Cloud credentials ---
  http.get("*/cloud-credentials", () => HttpResponse.json({ credentials })),
  http.get("*/cloud-credentials/:id", ({ params }) =>
    HttpResponse.json(
      credentials.find((c) => c.id === params.id) || credentials[0],
    ),
  ),
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

  // --- AI assistant (non-streaming mock) ---
  http.post("*/ai/chat", () =>
    HttpResponse.json({
      message: "(mock AI) This is a mocked assistant response.",
    }),
  ),
];
