import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Download, Eye, EyeOff, X } from "lucide-react";
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

// sshKeys is the useSshKeyGeneration controller and is required: without it
// the tabs would render and silently do nothing.
export default function SshKeyTabs({ sshKeys: keyState, gitRepository }) {
  const id = useId();
  const tabs = useRef([]);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [copying, setCopying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const configured = Boolean(gitRepository?.sshKeyConfigured);
  const hasKey = Boolean(gitRepository?.sshKey?.trim());
  const busy = keyState.status === "generating";
  const buttonClass = "btn-op-primary";

  useEffect(() => {
    if (!copyFeedback) return;
    const timeout = setTimeout(() => setCopyFeedback(null), 1800);
    return () => clearTimeout(timeout);
  }, [copyFeedback]);

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
      downloadKeys(keyState.pair);
    } catch {
      setDownloadError("Download failed. Please try again.");
    }
  };

  const copyKey = async (text, label) => {
    setCopyFeedback(null);
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback({ label, success: true });
    } catch {
      setCopyFeedback({ label, success: false });
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
        {["manual", "automatic"].map((mode, index) => (
          <button
            key={mode}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${mode}-tab`}
            aria-controls={`${id}-${mode}-panel`}
            aria-selected={keyState.mode === mode}
            tabIndex={keyState.mode === mode ? 0 : -1}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            onClick={() => {
              setPrivateKeyVisible(false);
              keyState.setMode(mode);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${keyState.mode === mode ? "bg-primary-muted text-primary ring-1 ring-inset ring-primary shadow-sm" : "text-secondary hover:bg-surface hover:text-primary"}`}
          >
            {mode === "automatic" ? "Auto" : "Manual"}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-automatic-panel`}
        aria-labelledby={`${id}-automatic-tab`}
        hidden={keyState.mode !== "automatic"}
        className="space-y-3"
      >
        {busy && <p role="status">Generating SSH key…</p>}
        {keyState.error && <p role="alert">{keyState.error}</p>}
        {!keyState.pair && !busy && (
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
              onClick={keyState.generate}
            >
              {keyState.status === "error"
                ? "Retry generation"
                : configured || hasKey
                  ? "Generate replacement key"
                  : "Generate key"}
            </button>
          </>
        )}
        {keyState.pair && (
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
                    {field === "privateKey" && (
                      <button
                        type="button"
                        className="ml-auto shrink-0 rounded-lg p-2 text-secondary hover:bg-background hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        aria-label={
                          privateKeyVisible
                            ? "Hide private key"
                            : "Unhide private key"
                        }
                        title={
                          privateKeyVisible
                            ? "Hide private key"
                            : "Unhide private key"
                        }
                        aria-expanded={privateKeyVisible}
                        aria-controls={`${id}-${suffix}`}
                        onClick={() =>
                          setPrivateKeyVisible((visible) => !visible)
                        }
                      >
                        {privateKeyVisible ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className={`shrink-0 rounded-lg p-2 transition-colors motion-safe:transition-transform motion-safe:active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${copyFeedback?.label === label ? (copyFeedback.success ? "bg-success-muted text-success" : "bg-danger-muted text-danger") : "text-secondary hover:bg-background hover:text-primary"}`}
                      aria-label={`Copy ${label.toLowerCase()} key`}
                      title={
                        copyFeedback?.label === label
                          ? copyFeedback.success
                            ? "Copied!"
                            : "Copy failed. Please try again."
                          : `Copy ${label.toLowerCase()} key`
                      }
                      disabled={copying}
                      onClick={() => copyKey(keyState.pair[field], label)}
                    >
                      {copyFeedback?.label === label ? (
                        copyFeedback.success ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <X className="h-4 w-4" aria-hidden="true" />
                        )
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <textarea
                    id={`${id}-${suffix}`}
                    aria-label={`SSH ${label} Key (Deploy Key)`}
                    className="block h-40 w-full resize-none rounded-none border-0 bg-transparent px-4 py-3 font-mono text-xs leading-relaxed focus:ring-inset"
                    rows={7}
                    readOnly
                    value={
                      field === "privateKey" && !privateKeyVisible
                        ? "••••••••••••••••"
                        : keyState.pair[field]
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p role="status" className="text-xs font-medium text-label">
                  {keyState.isSelected
                    ? "This generated key is selected for saving."
                    : "This generated key is not selected."}
                </p>
                <p className="text-xs text-tertiary">
                  Download both files together as a ZIP.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!keyState.isSelected && (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={keyState.useGeneratedKey}
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
            <span role="status" className="sr-only">
              {copyFeedback &&
                (copyFeedback.success
                  ? `${copyFeedback.label} key copied.`
                  : "Could not copy. Please try again.")}
            </span>
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
        hidden={keyState.mode !== "manual"}
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
          onChange={(event) => keyState.setManualKey(event.target.value)}
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
