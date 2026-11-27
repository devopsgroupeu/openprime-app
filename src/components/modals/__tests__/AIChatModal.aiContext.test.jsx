import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import AIChatModal from "../AIChatModal";

// OP-263. The wizard state holds the git deploy key once a user pastes or
// generates one. These tests read the request as it leaves the browser, so they
// hold no matter how the modal builds or sends it.
//
// The header is assembled for the repo's detect-private-key hook, as in
// wizardDraft.test.js.
const HEADER = ["-----BEGIN OPENSSH", "PRIVATE KEY-----"].join(" ");
const KEY_MATERIAL = "SECRETMATERIAL";
const DEPLOY_KEY = `${HEADER}\n${KEY_MATERIAL}\n${HEADER.replace("BEGIN", "END")}`;

const services = {
  eks: { enabled: true, version: "1.33", nodeInstanceType: "t3.medium" },
  rds: { enabled: false },
};

const wizardValues = {
  name: "staging",
  globalPrefix: "acme",
  provider: "aws",
  region: "eu-central-1",
  domain: "staging.example.com",
  cloudCredentialId: "cred-001",
  terraformBackend: { bucketName: "acme-tfstate", lockingMechanism: "s3" },
  gitRepository: {
    enabled: true,
    url: "git@github.com:acme/infra.git",
    branch: "main",
    sshKey: DEPLOY_KEY,
  },
  services,
};

function Harness({ values }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  return (
    <AIChatModal
      isOpen
      service="eks"
      serviceTitle="EKS"
      wizardValues={values}
      messages={messages}
      setMessages={setMessages}
      draft={draft}
      setDraft={setDraft}
      setNewEnv={() => {}}
      onClose={() => {}}
    />
  );
}

async function sendAndCapture(values = wizardValues) {
  let body = null;
  server.use(
    http.post("*/ai/chat", async ({ request }) => {
      body = await request.text();
      return new HttpResponse(
        'data: {"chunk":"ok"}\n\ndata: {"done":true}\n\n',
        {
          headers: { "Content-Type": "text/event-stream" },
        },
      );
    }),
  );

  render(<Harness values={values} />);
  fireEvent.change(screen.getByPlaceholderText("Ask about EKS..."), {
    target: { value: "Is this node size right?" },
  });
  fireEvent.submit(screen.getByPlaceholderText("Ask about EKS...").form);
  await waitFor(() => expect(body).not.toBeNull());
  return body;
}

describe("AIChatModal request context (OP-263)", () => {
  it("never sends the deploy key, anywhere in the request", async () => {
    const body = await sendAndCapture();

    expect(body).not.toContain("PRIVATE KEY");
    expect(body).not.toContain(KEY_MATERIAL);
    expect(body).not.toContain("sshKey");
    // Nor the rest of the git, credential and backend settings.
    expect(body).not.toContain("git@github.com:acme/infra.git");
    expect(body).not.toContain("cred-001");
    expect(body).not.toContain("acme-tfstate");
  });

  it("sends only the allow-listed wizard fields as wizardValues", async () => {
    const payload = JSON.parse(await sendAndCapture());

    expect(payload.wizardValues).toEqual({
      name: "staging",
      provider: "aws",
      region: "eu-central-1",
      services,
    });
    expect(payload.currentService).toBe("eks");
  });

  // Saved Helm custom values (P10) are customer config the backend never
  // reads: it only needs which charts are on.
  const withCharts = (helmCharts) => ({
    ...wizardValues,
    services: { ...services, eks: { ...services.eks, helmCharts } },
  });

  it("sends which charts are on, never their custom values text", async () => {
    const body = await sendAndCapture(
      withCharts({
        prometheusStack: {
          enabled: true,
          customValues: true,
          values: "grafana:\n  adminPassword: hunter2",
        },
        loki: { enabled: false, customValues: true },
      }),
    );

    expect(body).not.toContain("hunter2");
    expect(body).not.toContain("adminPassword");
    // No values key anywhere, the system messages' JSON included.
    expect(body).not.toMatch(/\\?"values\\?"/);
    expect(JSON.parse(body).wizardValues.services.eks.helmCharts).toEqual({
      prometheusStack: { enabled: true, customValues: true },
      loki: { enabled: false, customValues: true },
    });
  });

  it("sends charts without custom values exactly as before", async () => {
    const values = withCharts({
      prometheusStack: { enabled: true, customValues: false },
      loki: { enabled: false, customValues: true },
    });
    const payload = JSON.parse(await sendAndCapture(values));

    const context = {
      name: "staging",
      provider: "aws",
      region: "eu-central-1",
      services: values.services,
    };
    expect(JSON.stringify(payload.wizardValues)).toBe(JSON.stringify(context));
    const texts = payload.messages.map((m) => m.message);
    expect(texts).toContain(
      `The current environment configuration is: ${JSON.stringify(context)}`,
    );
    expect(texts).toContain(
      `Current eks configuration: ${JSON.stringify(values.services.eks)}`,
    );
  });
});
