import {
  act,
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdmZip from "adm-zip";
import { Buffer } from "node:buffer";
import SshKeyTabs from "../SshKeyTabs";
import { useState } from "react";
import { useSshKeyGeneration } from "../../../../wizard-page/useSshKeyGeneration";
import { generateSshKeyPair } from "../../../../../utils/sshKeyPair";
import { ThemeProvider } from "../../../../../contexts/ThemeContext";
import { ToastProvider } from "../../../../../contexts/ToastContext";
import { TooltipProvider } from "@/components/ui/tooltip";

// The copy buttons and the show/hide toggle carry tooltips; a failed copy
// toasts.
const render = (ui) =>
  rtlRender(
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider>{ui}</TooltipProvider>
      </ToastProvider>
    </ThemeProvider>,
  );

// Radix tabs activate on mouse down, not on click.
const selectTab = (name) =>
  fireEvent.mouseDown(screen.getByRole("tab", { name }));

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
  it("refuses to render without a key controller instead of inert tabs", () => {
    // React reports the render error to console.error before rethrowing it.
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => rtlRender(<SshKeyTabs gitRepository={{}} />)).toThrow();
  });

  it("copies each generated key exactly and briefly confirms success on its button", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "navigator",
      Object.create(navigator, {
        clipboard: { value: { writeText } },
      }),
    );
    render(<SshKeyTabs sshKeys={controller()} gitRepository={{}} />);
    const publicButton = screen.getByRole("button", {
      name: "Copy public key",
    });
    const privateButton = screen.getByRole("button", {
      name: "Copy private key",
    });
    await act(async () => fireEvent.click(publicButton));
    expect(publicButton).toHaveAccessibleName("Copied");
    expect(publicButton.querySelector(".lucide-check")).toBeInTheDocument();
    expect(privateButton).toHaveAccessibleName("Copy private key");
    expect(writeText).toHaveBeenLastCalledWith(pair.publicKey);
    await act(async () => fireEvent.click(privateButton));
    expect(privateButton).toHaveAccessibleName("Copied");
    expect(privateButton.querySelector(".lucide-check")).toBeInTheDocument();
    expect(writeText).toHaveBeenLastCalledWith(pair.privateKey);
    act(() => vi.advanceTimersByTime(1500));
    expect(publicButton).toHaveAccessibleName("Copy public key");
    expect(privateButton).toHaveAccessibleName("Copy private key");
    expect(privateButton.querySelector(".lucide-copy")).toBeInTheDocument();
  });

  it("shows failure feedback on the copy button without reporting success", async () => {
    vi.stubGlobal(
      "navigator",
      Object.create(navigator, {
        clipboard: {
          value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
        },
      }),
    );
    render(<SshKeyTabs sshKeys={controller()} gitRepository={{}} />);
    const button = screen.getByRole("button", { name: "Copy private key" });
    await act(async () => fireEvent.click(button));
    expect(
      await screen.findByText("Couldn't copy to the clipboard."),
    ).toBeInTheDocument();
    expect(button).toHaveAccessibleName("Copy private key");
    expect(button.querySelector(".lucide-check")).not.toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("defaults to pasting a key, clears it on reentry, and restores the generated pair", async () => {
    generateSshKeyPair.mockResolvedValue(pair);
    render(<Harness />);
    expect(
      screen.getByRole("tab", { name: "Paste existing key" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: "Paste existing key" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Download both keys" }),
    ).not.toBeInTheDocument();
    selectTab("Generate in browser");
    await screen.findByRole("button", { name: "Download both keys" });
    selectTab("Paste existing key");
    const manual = within(
      screen.getByRole("tabpanel", { name: "Paste existing key" }),
    );
    expect(manual.getByRole("textbox")).toHaveValue("");
    fireEvent.change(manual.getByRole("textbox"), {
      target: { value: "pasted-key" },
    });
    expect(manual.getByRole("textbox")).toHaveValue("pasted-key");
    selectTab("Generate in browser");
    const automatic = within(
      screen.getByRole("tabpanel", { name: "Generate in browser" }),
    );
    expect(
      automatic.getByLabelText("SSH public key (deploy key)"),
    ).toHaveAttribute("readonly");
    expect(
      automatic.getByLabelText("SSH private key (deploy key)"),
    ).toHaveAttribute("readonly");
    fireEvent.click(
      automatic.getByRole("button", { name: "Show private key" }),
    );
    expect(
      automatic.getByLabelText("SSH private key (deploy key)"),
    ).toHaveValue(pair.privateKey);
    expect(
      automatic.getByText("This generated key is selected for saving."),
    ).toBeVisible();
    selectTab("Paste existing key");
    expect(manual.getByRole("textbox")).toHaveValue("");
    selectTab("Generate in browser");
    expect(
      automatic.getByLabelText("SSH private key (deploy key)"),
    ).not.toHaveValue(pair.privateKey);
    expect(
      automatic.getByRole("button", { name: "Show private key" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  // Switching mode wipes a pasted key or starts a generation, so it waits for
  // an explicit choice: arrow keys only move focus, Enter or a click selects.
  it("moves focus with the arrow keys without switching the key mode", async () => {
    const sshKeys = controller({ mode: "manual", pair: null });
    render(<SshKeyTabs sshKeys={sshKeys} gitRepository={{}} />);
    const manualTab = screen.getByRole("tab", { name: "Paste existing key" });
    const autoTab = screen.getByRole("tab", { name: "Generate in browser" });

    act(() => manualTab.focus());
    fireEvent.keyDown(manualTab, { key: "ArrowRight" });

    // Radix moves roving focus on the next tick.
    await waitFor(() => expect(autoTab).toHaveFocus());
    expect(manualTab).toHaveAttribute("aria-selected", "true");
    expect(autoTab).toHaveAttribute("aria-selected", "false");
    expect(sshKeys.setMode).not.toHaveBeenCalled();

    fireEvent.keyDown(autoTab, { key: "Enter" });
    expect(sshKeys.setMode).toHaveBeenCalledWith("automatic");
  });

  it("masks the generated private key until revealed and provides one download action when generated", () => {
    render(
      <SshKeyTabs
        sshKeys={controller()}
        gitRepository={{ sshKey: pair.privateKey }}
      />,
    );
    const panel = within(
      screen.getByRole("tabpanel", { name: "Generate in browser" }),
    );
    expect(panel.getByLabelText("SSH public key (deploy key)")).toHaveValue(
      pair.publicKey,
    );
    const privateField = panel.getByLabelText("SSH private key (deploy key)");
    expect(privateField).not.toHaveValue(pair.privateKey);
    expect(privateField).toHaveAttribute("readonly");
    const toggle = panel.getByRole("button", { name: "Show private key" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(privateField).toHaveValue(pair.privateKey);
    expect(
      panel.getByRole("button", { name: "Hide private key" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(privateField).not.toHaveValue(pair.privateKey);
    expect(
      panel.getByRole("button", { name: "Download both keys" }),
    ).toBeEnabled();
    expect(
      panel.queryByRole("button", { name: "Download public key" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the pasted key as an editable private-key input with existing-key help", () => {
    const sshKeys = controller({ mode: "manual" });
    render(
      <SshKeyTabs
        sshKeys={sshKeys}
        gitRepository={{ sshKey: "", sshKeyConfigured: true }}
      />,
    );
    const panel = within(
      screen.getByRole("tabpanel", { name: "Paste existing key" }),
    );
    const input = panel.getByLabelText("SSH private key (deploy key)");
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
