import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdmZip from "adm-zip";
import { Buffer } from "node:buffer";
import SshKeyTabs from "../SshKeyTabs";
import { useState } from "react";
import { useSshKeyGeneration } from "../../../../wizard-page/useSshKeyGeneration";
import { generateSshKeyPair } from "../../../../../utils/sshKeyPair";

vi.mock("../../../../../utils/sshKeyPair", () => ({
  generateSshKeyPair: vi.fn(),
}));

function Harness() {
  const [newEnv, setNewEnv] = useState({ gitRepository: { enabled: true } });
  const sshKeys = useSshKeyGeneration({
    newEnv,
    setNewEnv,
    active: true,
    identity: "test",
  });
  return <SshKeyTabs sshKeys={sshKeys} gitRepository={newEnv.gitRepository} />;
}

const pair = { publicKey: "test-public-key", privateKey: "test-private-key" };
const controller = (overrides = {}) => ({
  mode: "automatic",
  status: "ready",
  pair,
  error: "",
  isSelected: true,
  setMode: vi.fn(),
  setManualKey: vi.fn(),
  generate: vi.fn(),
  useGeneratedKey: vi.fn(),
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("SshKeyTabs", () => {
  it("copies each generated key exactly and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "navigator",
      Object.create(navigator, {
        clipboard: { value: { writeText } },
      }),
    );
    render(<SshKeyTabs sshKeys={controller()} gitRepository={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy public key" }));
    expect(await screen.findByText("Public key copied.")).toBeVisible();
    expect(writeText).toHaveBeenLastCalledWith(pair.publicKey);
    fireEvent.click(screen.getByRole("button", { name: "Copy private key" }));
    expect(await screen.findByText("Private key copied.")).toBeVisible();
    expect(writeText).toHaveBeenLastCalledWith(pair.privateKey);
  });

  it("shows a useful message when clipboard access fails", async () => {
    vi.stubGlobal(
      "navigator",
      Object.create(navigator, {
        clipboard: {
          value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
        },
      }),
    );
    render(<SshKeyTabs sshKeys={controller()} gitRepository={{}} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy private key" }));
    expect(
      await screen.findByText(
        "Could not copy. Select the text and copy it manually.",
      ),
    ).toBeVisible();
  });

  it("clears Manual on entry and restores the read-only generated pair in Automatic", async () => {
    generateSshKeyPair.mockResolvedValue(pair);
    render(<Harness />);
    await screen.findByRole("button", { name: "Download both keys" });
    fireEvent.click(screen.getByRole("tab", { name: "Manual" }));
    const manual = within(screen.getByRole("tabpanel", { name: "Manual" }));
    expect(manual.getByRole("textbox")).toHaveValue("");
    fireEvent.change(manual.getByRole("textbox"), {
      target: { value: "pasted-key" },
    });
    expect(manual.getByRole("textbox")).toHaveValue("pasted-key");
    fireEvent.click(screen.getByRole("tab", { name: "Automatic" }));
    const automatic = within(
      screen.getByRole("tabpanel", { name: "Automatic" }),
    );
    expect(
      automatic.getByLabelText("SSH Public Key (Deploy Key)"),
    ).toHaveAttribute("readonly");
    expect(
      automatic.getByLabelText("SSH Private Key (Deploy Key)"),
    ).toHaveAttribute("readonly");
    expect(
      automatic.getByLabelText("SSH Private Key (Deploy Key)"),
    ).toHaveValue(pair.privateKey);
    expect(automatic.getByRole("status")).toHaveTextContent(
      "selected for saving",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Manual" }));
    expect(manual.getByRole("textbox")).toHaveValue("");
  });
  it("provides both generated keys and one download action in Automatic", () => {
    render(
      <SshKeyTabs
        sshKeys={controller()}
        gitRepository={{ sshKey: pair.privateKey }}
      />,
    );
    const panel = within(screen.getByRole("tabpanel", { name: "Automatic" }));
    expect(panel.getByLabelText("SSH Public Key (Deploy Key)")).toHaveValue(
      pair.publicKey,
    );
    const privateField = panel.getByLabelText("SSH Private Key (Deploy Key)");
    expect(privateField).toHaveValue(pair.privateKey);
    expect(privateField).toHaveAttribute("readonly");
    expect(
      panel.getByRole("button", { name: "Download both keys" }),
    ).toBeEnabled();
    expect(
      panel.queryByRole("button", { name: "Download public key" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Manual as an editable private-key input with existing-key help", () => {
    const sshKeys = controller({ mode: "manual" });
    render(
      <SshKeyTabs
        sshKeys={sshKeys}
        gitRepository={{ sshKey: "", sshKeyConfigured: true }}
      />,
    );
    const panel = within(screen.getByRole("tabpanel", { name: "Manual" }));
    const input = panel.getByLabelText("SSH Private Key (Deploy Key)");
    expect(input).toHaveAttribute(
      "placeholder",
      "Leave blank to keep the current key",
    );
    expect(input).not.toHaveAttribute("readonly");
    expect(
      panel.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "pasted-private-key" } });
    expect(sshKeys.setManualKey).toHaveBeenCalledWith("pasted-private-key");
  });

  it("downloads one ZIP with both matching keys and releases its URL", async () => {
    const createUrl = vi.fn(() => "blob:keys");
    const revokeUrl = vi.fn();
    const previousCreate = URL.createObjectURL;
    const previousRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = revokeUrl;
    let filename;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function () {
        filename = this.download;
      },
    );
    try {
      render(<SshKeyTabs sshKeys={controller()} gitRepository={{}} />);
      expect(createUrl).not.toHaveBeenCalled();
      vi.useFakeTimers();
      fireEvent.click(
        screen.getByRole("button", { name: "Download both keys" }),
      );
      expect(filename).toBe("openprime-deploy-keys.zip");
      expect(createUrl).toHaveBeenCalledTimes(1);
      expect(revokeUrl).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(revokeUrl).toHaveBeenCalledWith("blob:keys");
      vi.useRealTimers();
      const blob = createUrl.mock.calls[0][0];
      expect(blob.type).toBe("application/zip");
      const bytes = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
      // adm-zip uses instanceof Uint8Array on Node Buffers; jsdom has a
      // separate realm. Use the Node constructor for this Node-only parser.
      vi.stubGlobal(
        "Uint8Array",
        Object.getPrototypeOf(Buffer.prototype).constructor,
      );
      const archive = new AdmZip({ input: Buffer.from(bytes) });
      expect(
        archive
          .getEntries()
          .map((entry) => entry.entryName)
          .sort(),
      ).toEqual(["openprime-deploy-key.pem", "openprime-deploy-key.pub"]);
      expect(archive.readAsText("openprime-deploy-key.pub")).toBe(
        pair.publicKey,
      );
      expect(archive.readAsText("openprime-deploy-key.pem")).toBe(
        pair.privateKey,
      );
    } finally {
      URL.createObjectURL = previousCreate;
      URL.revokeObjectURL = previousRevoke;
    }
  });
});
