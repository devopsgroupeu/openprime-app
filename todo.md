# Automatic SSH keys

Proposed code only. Lines reference `8f7ca1e`, before applying changes. New files start at line 1. No dependencies or backend changes.

## 1. Change: browser key generation

**Current code:** none.

**Target:** create `src/utils/sshKeyPair.js`:

```js

```

RSA-3072, unencrypted PKCS#8 private key, OpenSSH public key. Backend support: `../openprime-app-backend/src/utils/sshKey.js:62–84`. No custom cryptography, Node polyfills or passphrase flow.

## 2. Change: retain keys across wizard steps, outside saved drafts

**Current code:** `WizardPage.jsx:44–48` owns form state; `WizardStepContent.jsx:21–64` unmounts inactive steps. No generation state exists.

**Target:** create `src/components/wizard-page/useSshKeyGeneration.js`:

```js

```

Automatic generation only starts for an empty, unconfigured key. Existing keys require the explicit replacement button. Tab changes preserve the selected key; errors never clear it.

## 3. Change: add accessible tabs and downloads

**Current code:** `GitRepositorySection.jsx:100–139` is the manual field. Download pattern exists at `EnvironmentDetailPage.jsx:149–158`.

**Target:** create `src/components/modals/wizard/basic-config/SshKeyTabs.jsx`:

```jsx

```

## 4. Change: connect the components

### `src/components/WizardPage.jsx`

**Current:** imports at lines 4–33; `currentId` at line 149; `<WizardStepContent>` at lines 346–365.

**Target:** add this import:

```js
import { useSshKeyGeneration } from "./wizard-page/useSshKeyGeneration";
```

Immediately after `const currentId = activeIds[currentStep - 1] || "basic";`, add:

```js
const sshKeys = useSshKeyGeneration({
  newEnv,
  setNewEnv,
  active: currentId === "basic",
  identity: `${userId || "anonymous"}:${id || "create"}`,
});
```

Add this prop to the existing `<WizardStepContent>`:

```jsx
sshKeys={sshKeys}
```

### `src/components/wizard-page/WizardStepContent.jsx`

**Current:** props at lines 8–20; BasicConfigStep at lines 24–35.

**Target:** add `sshKeys,` to the destructured props and this prop to `<BasicConfigStep>`:

```jsx
sshKeys={sshKeys}
```

### `src/components/modals/wizard/BasicConfigStep.jsx`

**Current:** props at lines 27–32; line 452:

```jsx
<GitRepositorySection newEnv={newEnv} setNewEnv={setNewEnv} />
```

**Target:** add `sshKeys,` to the destructured props; replace line 452:

```jsx
<GitRepositorySection newEnv={newEnv} setNewEnv={setNewEnv} sshKeys={sshKeys} />
```

### `src/components/modals/wizard/basic-config/GitRepositorySection.jsx`

**Current:** lines 1–6:

```jsx
import { GitBranch, AlertTriangle } from "lucide-react";

// Git repository card of the wizard's Basic Configuration step.
// Presentational: env state is owned by the parent BasicConfigStep.
const GitRepositorySection = ({ newEnv, setNewEnv }) => {
  const keyAlreadyConfigured = Boolean(newEnv.gitRepository?.sshKeyConfigured);
```

**Target:** replace lines 1–6:

```jsx
import { GitBranch, AlertTriangle } from "lucide-react";
import SshKeyTabs from "./SshKeyTabs";

const GitRepositorySection = ({ newEnv, setNewEnv, sshKeys }) => {
```

**Current:** lines 100–139 contain the private-key field and configured-key help.

**Target:** replace that entire `<div>` with:

```jsx
<SshKeyTabs sshKeys={sshKeys} gitRepository={newEnv.gitRepository} />
```

Keep URL, branch, toggle and deployment prerequisites unchanged. Keep `wizardDraft.js:30–31` and `WizardPage.jsx:200,215` unchanged: the private key still uses `gitRepository.sshKey`; generation state never enters the saved draft or API payload.

## 5. Change: update existing test harnesses

### `src/components/modals/wizard/__tests__/BasicConfigStep.test.jsx`

**Current:** imports at lines 1–4; Harness at lines 7–15; assertion at line 61.

**Target:** add the import and replace Harness:

```jsx
import { useSshKeyGeneration } from "../../../wizard-page/useSshKeyGeneration";

function Harness({ initial }) {
  const [newEnv, setNewEnv] = useState(initial);
  const sshKeys = useSshKeyGeneration({ newEnv, setNewEnv, active: true, identity: "test" });
  return (
    <ToastProvider>
      <BasicConfigStep newEnv={newEnv} setNewEnv={setNewEnv} sshKeys={sshKeys} />
    </ToastProvider>
  );
}
```

Replace `expect(screen.getByText(/SSH Private Key/)).toBeInTheDocument();` with:

```jsx
expect(screen.getByRole("tab", { name: "Automatic" })).toHaveAttribute("aria-selected", "true");
fireEvent.click(screen.getByRole("tab", { name: "Manual" }));
expect(screen.getByLabelText("SSH Private Key (Deploy Key)")).toBeVisible();
```

### `src/components/modals/wizard/__tests__/BasicConfigStep.domain.test.jsx`

**Current:** Harness at lines 10–24.

**Target:** add the same hook import above and replace Harness:

```jsx
function Harness({ initial, isEditMode = false }) {
  const [newEnv, setNewEnv] = useState(initial);
  const sshKeys = useSshKeyGeneration({ newEnv, setNewEnv, active: true, identity: "test" });
  return (
    <ToastProvider>
      <BasicConfigStep
        newEnv={newEnv}
        setNewEnv={setNewEnv}
        sshKeys={sshKeys}
        isEditMode={isEditMode}
        validationErrors={[]}
      />
    </ToastProvider>
  );
}
```

## 6. Change: test encoding against a real private key

**Current code:** none.

**Target:** create `src/utils/__tests__/sshKeyPair.test.js`:

```js
import { webcrypto, createPrivateKey, createPublicKey } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodePrivatePem, encodeSshRsaPublicKey, generateSshKeyPair } from "../sshKeyPair";

function decodeFields(publicKey) {
  const bytes = Uint8Array.from(atob(publicKey.split(" ")[1]), (char) => char.charCodeAt(0));
  const fields = [];
  let offset = 0;
  while (offset < bytes.length) {
    const length = new DataView(bytes.buffer).getUint32(offset, false);
    offset += 4;
    fields.push(bytes.slice(offset, offset + length));
    offset += length;
  }
  return fields;
}

function unsignedBase64Url(bytes) {
  let start = 0;
  while (start < bytes.length && bytes[start] === 0) start += 1;
  return btoa(String.fromCharCode(...bytes.subarray(start)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

afterEach(() => vi.unstubAllGlobals());

describe("SSH key serialization", () => {
  it("wraps PKCS#8 bytes at 64 columns with a final newline", () => {
    const pem = encodePrivatePem(new Uint8Array(100).buffer);
    const lines = pem.split("\n");
    expect(lines[0]).toBe(["-----BEGIN", "PRIVATE KEY-----"].join(" "));
    expect(lines[1]).toHaveLength(64);
    expect(lines.at(-1)).toBe("");
    expect(atob(lines.slice(1, -2).join(""))).toHaveLength(100);
  });

  it("encodes signed mpints, removes redundant zeroes and decodes base64url", () => {
    const fields = decodeFields(encodeSshRsaPublicKey({ e: "AAEAAQ", n: "gP8_" }));
    expect(new TextDecoder().decode(fields[0])).toBe("ssh-rsa");
    expect([...fields[1]]).toEqual([1, 0, 1]);
    expect([...fields[2]]).toEqual([0, 128, 255, 63]);
  });

  it("exports a public key matching the generated PKCS#8 private key", async () => {
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("crypto", webcrypto);
    const pair = await generateSshKeyPair();
    const privateKey = createPrivateKey(pair.privateKey);
    const publicJwk = createPublicKey(privateKey).export({ format: "jwk" });
    const fields = decodeFields(pair.publicKey);
    expect(privateKey.asymmetricKeyDetails.modulusLength).toBe(3072);
    expect(unsignedBase64Url(fields[1])).toBe(publicJwk.e);
    expect(unsignedBase64Url(fields[2])).toBe(publicJwk.n);
    expect(pair.publicKey.endsWith(" openprime-deploy\n")).toBe(true);
  }, 15000);

  it("rejects insecure contexts without a fallback", async () => {
    vi.stubGlobal("isSecureContext", false);
    await expect(generateSshKeyPair()).rejects.toThrow("HTTPS or localhost");
  });
});
```

## 7. Change: test async selection and wizard lifetime

**Current code:** none.

**Target:** create `src/components/wizard-page/__tests__/useSshKeyGeneration.test.jsx`:

```jsx
import { StrictMode, useState } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { generateSshKeyPair } from "../../../utils/sshKeyPair";
import { saveDraft } from "../../../utils/wizardDraft";
import { useSshKeyGeneration } from "../useSshKeyGeneration";

vi.mock("../../../utils/sshKeyPair", () => ({ generateSshKeyPair: vi.fn() }));

const pair = { privateKey: "test-private-material", publicKey: "test-public-material" };

function setup(initialGit = { enabled: true }) {
  let resolve;
  let reject;
  generateSshKeyPair.mockReturnValue(new Promise((ok, fail) => { resolve = ok; reject = fail; }));
  const hook = renderHook(
    ({ active, identity }) => {
      const [env, setEnv] = useState({ gitRepository: initialGit });
      const keys = useSshKeyGeneration({ newEnv: env, setNewEnv: setEnv, active, identity });
      return { env, setEnv, keys };
    },
    {
      initialProps: { active: true, identity: "first" },
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    },
  );
  return { ...hook, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

it("generates once under Strict Mode and retains the pair across steps", async () => {
  const { result, resolve, rerender } = setup();
  expect(generateSshKeyPair).toHaveBeenCalledTimes(1);
  await act(async () => resolve(pair));
  expect(result.current.env.gitRepository.sshKey).toBe(pair.privateKey);
  rerender({ active: false, identity: "first" });
  rerender({ active: true, identity: "first" });
  expect(result.current.keys.pair).toEqual(pair);
  expect(generateSshKeyPair).toHaveBeenCalledTimes(1);
  expect(saveDraft("test", result.current.env)).toBe(true);
  const draft = localStorage.getItem("op-wizard-draft:test");
  expect(draft).not.toBeNull();
  expect(draft).not.toContain(pair.privateKey);
  expect(JSON.parse(draft).gitRepository).not.toHaveProperty("sshKey");
  expect(result.current.env.gitRepository).not.toHaveProperty("pair");
});

it("does not replace manual input with a late generation result", async () => {
  const { result, resolve } = setup();
  act(() => result.current.keys.setMode("manual"));
  act(() => result.current.keys.setManualKey("manual-key"));
  await act(async () => resolve(pair));
  expect(result.current.env.gitRepository.sshKey).toBe("manual-key");
  expect(result.current.keys.isSelected).toBe(false);
});

it("does not generate while disabled or replace a configured key automatically", () => {
  const disabled = setup({ enabled: false });
  expect(generateSshKeyPair).not.toHaveBeenCalled();
  disabled.unmount();
  const existing = setup({ enabled: true, sshKeyConfigured: true });
  expect(generateSshKeyPair).not.toHaveBeenCalled();
  act(() => existing.result.current.keys.generate());
  expect(generateSshKeyPair).toHaveBeenCalledTimes(1);
});

it("does not select a late key after Git is disabled", async () => {
  const { result, resolve } = setup();
  act(() => result.current.setEnv({ gitRepository: { enabled: false } }));
  await act(async () => resolve(pair));
  expect(result.current.env.gitRepository.sshKey).toBeUndefined();
});

it("preserves URL changes when selecting a generated key", async () => {
  const { result, resolve } = setup();
  act(() => result.current.setEnv((prev) => ({
    ...prev, gitRepository: { ...prev.gitRepository, url: "git@example.com:new.git" },
  })));
  await act(async () => resolve(pair));
  act(() => result.current.keys.useGeneratedKey());
  expect(result.current.env.gitRepository.url).toBe("git@example.com:new.git");
});

it("shows a retryable error without clearing an existing key", async () => {
  const { result, reject } = setup({ enabled: true, sshKey: "existing" });
  act(() => result.current.keys.generate());
  await act(async () => reject(new Error("test failure")));
  await waitFor(() => expect(result.current.keys.status).toBe("error"));
  expect(result.current.env.gitRepository.sshKey).toBe("existing");
  generateSshKeyPair.mockResolvedValue(pair);
  await act(async () => result.current.keys.generate());
  expect(result.current.keys.status).toBe("ready");
});
```

## Verification after applying

```bash
npx prettier --write src/utils/sshKeyPair.js src/utils/__tests__/sshKeyPair.test.js src/components/wizard-page/useSshKeyGeneration.js src/components/wizard-page/__tests__/useSshKeyGeneration.test.jsx src/components/modals/wizard/basic-config/SshKeyTabs.jsx src/components/modals/wizard/basic-config/GitRepositorySection.jsx src/components/modals/wizard/BasicConfigStep.jsx src/components/wizard-page/WizardStepContent.jsx src/components/WizardPage.jsx src/components/modals/wizard/__tests__/BasicConfigStep.test.jsx src/components/modals/wizard/__tests__/BasicConfigStep.domain.test.jsx
npx vitest run src/utils/__tests__/sshKeyPair.test.js src/components/wizard-page/__tests__/useSshKeyGeneration.test.jsx src/components/modals/wizard/__tests__/BasicConfigStep.test.jsx src/components/modals/wizard/__tests__/BasicConfigStep.domain.test.jsx src/components/__tests__/WizardPage.test.jsx src/utils/__tests__/wizardDraft.test.js
npm run lint
npm run format:check
npm run build
```

In Chrome, Firefox and Safari: enable Git, download both keys, switch tabs, edit a manual key, navigate Next/Back, and confirm the selected pair stays consistent. Verify keyboard tabs and insecure-HTTP fallback. With disposable downloaded files outside the repo:

```bash
chmod 600 openprime-deploy-key.pem
ssh-keygen -y -f openprime-deploy-key.pem
ssh-keygen -lf openprime-deploy-key.pub
```

Compare derived public-key fields with `.pub`; register the public key on a test repository and verify the existing clone/push flow. No private-key fixtures should be committed.
