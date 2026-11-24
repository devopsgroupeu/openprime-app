import { useId, useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { strToU8, zipSync } from "fflate";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MASK = "\u2022".repeat(16);
const KEY_FIELD =
  "field-sizing-fixed h-32 resize-none font-mono text-xs leading-relaxed md:text-xs";

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
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const configured = Boolean(gitRepository?.sshKeyConfigured);
  const hasKey = Boolean(gitRepository?.sshKey?.trim());
  const busy = keyState.status === "generating";
  const fingerprint = gitRepository?.sshKeyFingerprint
    ? ` (${gitRepository.sshKeyFingerprint})`
    : "";

  const download = () => {
    setDownloadError("");
    try {
      downloadKeys(keyState.pair);
    } catch {
      setDownloadError("Download failed. Try again.");
    }
  };

  const toggleLabel = privateKeyVisible
    ? "Hide private key"
    : "Show private key";

  return (
    // Both panels stay mounted (hidden when inactive) so a half-typed key and
    // the generated pair survive a tab switch. Manual activation: switching
    // mode clears a pasted key or starts a generation, so arrow keys only move
    // focus and Enter, Space or a click selects.
    <Tabs
      activationMode="manual"
      value={keyState.mode}
      onValueChange={(mode) => {
        setPrivateKeyVisible(false);
        keyState.setMode(mode);
      }}
      className="gap-3"
    >
      <TabsList aria-label="SSH key setup">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="automatic">Auto</TabsTrigger>
      </TabsList>

      <TabsContent
        value="manual"
        forceMount
        hidden={keyState.mode !== "manual"}
        className="flex flex-col gap-1.5"
      >
        <Label htmlFor={`${id}-private`} className="text-xs font-medium">
          SSH private key (deploy key)
        </Label>
        <Textarea
          id={`${id}-private`}
          className={KEY_FIELD}
          placeholder={
            configured
              ? "Leave blank to keep the current key"
              : "Paste your SSH private key"
          }
          value={gitRepository?.sshKey || ""}
          onChange={(event) => keyState.setManualKey(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {configured
            ? `A key is already configured${fingerprint}. Leave this blank to keep it, or paste a new key to replace it.`
            : "A private key with write access to the repository."}
        </p>
      </TabsContent>

      <TabsContent
        value="automatic"
        forceMount
        hidden={keyState.mode !== "automatic"}
        className="flex flex-col gap-3"
      >
        {busy && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner aria-hidden />
            Generating an SSH key...
          </p>
        )}
        {keyState.error && (
          <p role="alert" className="text-sm text-destructive">
            {keyState.error}
          </p>
        )}
        {!keyState.pair && !busy && (
          <div className="flex flex-col items-start gap-2">
            {configured && (
              <p className="text-xs text-muted-foreground">
                A key is already configured{fingerprint}. A replacement takes
                effect when saved; register its public key first.
              </p>
            )}
            {!configured && hasKey && (
              <p className="text-xs text-muted-foreground">
                A manually entered key is selected.
              </p>
            )}
            <Button variant="secondary" onClick={keyState.generate}>
              {keyState.status === "error"
                ? "Retry generation"
                : configured || hasKey
                  ? "Generate replacement key"
                  : "Generate key"}
            </Button>
          </div>
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
                <div key={field} className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex h-6 items-center justify-between gap-2">
                    <Label
                      htmlFor={`${id}-${suffix}`}
                      className="text-xs font-medium"
                    >
                      {label} key
                    </Label>
                    <div className="flex items-center gap-0.5">
                      {field === "privateKey" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={toggleLabel}
                              aria-expanded={privateKeyVisible}
                              aria-controls={`${id}-${suffix}`}
                              onClick={() =>
                                setPrivateKeyVisible((visible) => !visible)
                              }
                            >
                              {privateKeyVisible ? (
                                <EyeOff aria-hidden />
                              ) : (
                                <Eye aria-hidden />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{toggleLabel}</TooltipContent>
                        </Tooltip>
                      )}
                      <CopyButton
                        text={keyState.pair[field]}
                        label={`Copy ${label.toLowerCase()} key`}
                        size="icon-xs"
                      />
                    </div>
                  </div>
                  <Textarea
                    id={`${id}-${suffix}`}
                    aria-label={`SSH ${label.toLowerCase()} key (deploy key)`}
                    className={KEY_FIELD}
                    readOnly
                    value={
                      field === "privateKey" && !privateKeyVisible
                        ? MASK
                        : keyState.pair[field]
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-0.5">
                <p role="status" className="text-sm">
                  {keyState.isSelected
                    ? "This generated key is selected for saving."
                    : "This generated key is not selected."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Add the public key to your repository&apos;s deploy keys with
                  write access.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!keyState.isSelected && (
                  <Button
                    variant="secondary"
                    onClick={keyState.useGeneratedKey}
                  >
                    Use generated key
                  </Button>
                )}
                <Button variant="secondary" onClick={download}>
                  <Download aria-hidden />
                  Download both keys
                </Button>
              </div>
            </div>
          </>
        )}
        {downloadError && (
          <p role="alert" className="text-sm text-destructive">
            {downloadError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Generated in your browser. The selected private key is sent to
          OpenPrime when you save. Download a backup: drafts never keep private
          keys.
        </p>
      </TabsContent>
    </Tabs>
  );
}
