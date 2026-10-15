import { useId, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import { strToU8, zipSync } from "fflate";

function downloadKeys(pair) {
  const archive = zipSync(
    {
      "openprime-deploy-key.pub": strToU8(pair.publicKey),
      "openprime-deploy-key.pem": strToU8(pair.privateKey),
    },
    { level: 0 },
  );
  const url = URL.createObjectURL(
    new Blob([archive], { type: "application/zip" }),
  );
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = "openprime-deploy-keys.zip";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export default function SshKeyTabs({ sshKeys, gitRepository }) {
  const id = useId();
  const tabs = useRef([]);
  const [downloadError, setDownloadError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copying, setCopying] = useState(false);
  const configured = Boolean(gitRepository?.sshKeyConfigured);
  const hasKey = Boolean(gitRepository?.sshKey?.trim());
  const busy = sshKeys.status === "generating";
  const buttonClass =
    "px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50";

  const onTabKeyDown = (event, index) => {
    const next = {
      ArrowLeft: (index + 1) % 2,
      ArrowRight: (index + 1) % 2,
      Home: 0,
      End: 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs.current[next]?.focus();
  };

  const download = () => {
    setDownloadError("");
    try {
      downloadKeys(sshKeys.pair);
    } catch {
      setDownloadError("Download failed. Please try again.");
    }
  };

  const copyKey = async (text, label) => {
    setCopyMessage("");
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} key copied.`);
    } catch {
      setCopyMessage("Could not copy. Select the text and copy it manually.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="SSH key setup"
        className="inline-flex gap-1 rounded-xl border border-border bg-background p-1"
      >
        {["automatic", "manual"].map((mode, index) => (
          <button
            key={mode}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${mode}-tab`}
            aria-controls={`${id}-${mode}-panel`}
            aria-selected={sshKeys.mode === mode}
            tabIndex={sshKeys.mode === mode ? 0 : -1}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            onClick={() => sshKeys.setMode(mode)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${sshKeys.mode === mode ? "bg-surface text-label shadow-sm" : "text-secondary hover:text-label"}`}
          >
            {mode === "automatic" ? "Automatic" : "Manual"}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-automatic-panel`}
        aria-labelledby={`${id}-automatic-tab`}
        hidden={sshKeys.mode !== "automatic"}
        className="space-y-3"
      >
        {busy && <p role="status">Generating SSH key…</p>}
        {sshKeys.error && <p role="alert">{sshKeys.error}</p>}
        {!sshKeys.pair && !busy && (
          <>
            {configured && (
              <p className="text-xs text-tertiary">
                A key is already configured
                {gitRepository.sshKeyFingerprint
                  ? ` (${gitRepository.sshKeyFingerprint})`
                  : ""}
                . A replacement takes effect when saved; register its public key
                first.
              </p>
            )}
            {!configured && hasKey && (
              <p className="text-xs text-tertiary">
                A manually entered key is selected.
              </p>
            )}
            <button
              type="button"
              className={buttonClass}
              onClick={sshKeys.generate}
            >
              {sshKeys.status === "error"
                ? "Retry generation"
                : configured || hasKey
                  ? "Generate replacement key"
                  : "Generate key"}
            </button>
          </>
        )}
        {sshKeys.pair && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { field: "publicKey", label: "Public", suffix: "public" },
                {
                  field: "privateKey",
                  label: "Private",
                  suffix: "generated-private",
                },
              ].map(({ field, label, suffix }) => (
                <div
                  key={field}
                  className="min-w-0 overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                    <label
                      htmlFor={`${id}-${suffix}`}
                      className="text-sm font-semibold text-label"
                    >
                      {label} key
                    </label>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-2 text-secondary hover:bg-background hover:text-label focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                      aria-label={`Copy ${label.toLowerCase()} key`}
                      title={`Copy ${label.toLowerCase()} key`}
                      disabled={copying}
                      onClick={() => copyKey(sshKeys.pair[field], label)}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <textarea
                    id={`${id}-${suffix}`}
                    aria-label={`SSH ${label} Key (Deploy Key)`}
                    className="block h-40 w-full resize-none rounded-none border-0 bg-transparent px-4 py-3 font-mono text-xs leading-relaxed focus:ring-inset"
                    rows={7}
                    readOnly
                    value={sshKeys.pair[field]}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p role="status" className="text-xs font-medium text-label">
                  {sshKeys.isSelected
                    ? "This generated key is selected for saving."
                    : "This generated key is not selected."}
                </p>
                <p className="text-xs text-tertiary">
                  Download both files together as a ZIP.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!sshKeys.isSelected && (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={sshKeys.useGeneratedKey}
                  >
                    Use generated key
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={download}
                  aria-label="Download both keys"
                  title="Download both keys"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download keys
                </button>
              </div>
            </div>
            <p
              aria-live="polite"
              className={copyMessage ? "text-xs text-secondary" : "sr-only"}
            >
              {copyMessage}
            </p>
          </>
        )}
        {downloadError && <p role="alert">{downloadError}</p>}
        <div className="space-y-1 text-xs leading-relaxed text-tertiary">
          <p>
            Add the public key to your repository&apos;s deploy keys with write
            access.
          </p>
          <p>
            Generated in your browser; the selected private key is sent to
            OpenPrime on save. Download a backup — private keys are not included
            in saved drafts.
          </p>
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${id}-manual-panel`}
        aria-labelledby={`${id}-manual-tab`}
        hidden={sshKeys.mode !== "manual"}
      >
        <label
          htmlFor={`${id}-private`}
          className="text-sm font-semibold text-label block mb-2"
        >
          SSH Private Key (Deploy Key)
        </label>
        <textarea
          id={`${id}-private`}
          className="w-full px-4 py-2 font-mono text-xs transition-colors"
          placeholder={
            configured
              ? "Leave blank to keep the current key"
              : "Paste your SSH private key here"
          }
          rows={8}
          value={gitRepository?.sshKey || ""}
          onChange={(event) => sshKeys.setManualKey(event.target.value)}
        />
        <p className="text-xs mt-1 text-tertiary">
          {configured
            ? `A key is already configured${gitRepository.sshKeyFingerprint ? ` (${gitRepository.sshKeyFingerprint})` : ""}. Leave this blank to keep it, or paste a new key to replace it.`
            : "Private SSH key with write access to the repository"}
        </p>
      </div>
    </div>
  );
}
