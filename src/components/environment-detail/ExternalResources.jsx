import { useState } from "react";
import {
  GitBranch,
  Database,
  ExternalLink,
  Key,
  KeyRound,
  X,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";

const cleanGitUrl = (url) =>
  (url || "")
    .replace("git@github.com:", "")
    .replace("git@gitlab.com:", "")
    .replace(/\.git$/, "");

const gitWebUrl = (url) =>
  (url || "")
    .replace("git@github.com:", "https://github.com/")
    .replace("git@gitlab.com:", "https://gitlab.com/")
    .replace(/\.git$/, "");

const ExternalResources = ({ environment, onEnvironmentUpdate }) => {
  const { success, error: showError } = useToast();
  const [showSshKeyEditor, setShowSshKeyEditor] = useState(false);
  const [newSshKey, setNewSshKey] = useState("");
  const [isSavingSshKey, setIsSavingSshKey] = useState(false);

  const gitRepo = environment.git_repository || environment.gitRepository;
  const tfBackend =
    environment.terraform_backend || environment.terraformBackend;
  const gitEnabled = gitRepo?.enabled;
  const tfEnabled = tfBackend?.enabled;

  if (!gitEnabled && !tfEnabled) return null;

  const handleRotateSshKey = async () => {
    if (!newSshKey.trim()) {
      showError("Please enter an SSH private key");
      return;
    }
    try {
      setIsSavingSshKey(true);
      const updated = await authService.put(`/environments/${environment.id}`, {
        ...environment,
        gitRepository: { ...gitRepo, sshKey: newSshKey.trim() },
      });
      onEnvironmentUpdate?.(updated);
      setShowSshKeyEditor(false);
      setNewSshKey("");
      success("SSH key updated successfully");
    } catch (err) {
      console.error("Failed to update SSH key:", err);
      showError(err.message || "Failed to update SSH key");
    } finally {
      setIsSavingSshKey(false);
    }
  };

  const lockingLabel =
    tfBackend?.lockingMechanism === "s3"
      ? "S3 Native"
      : tfBackend?.lockingMechanism || "—";

  return (
    <section>
      <h2 className="text-2xl font-extrabold text-primary mb-4">
        External Resources
      </h2>
      <div className="space-y-4">
        {/* Git Repository */}
        {gitEnabled && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary-muted border border-primary shrink-0">
                  <GitBranch className="w-6 h-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-primary truncate">
                    Git Repository
                  </h4>
                  <p className="text-xs font-mono text-tertiary truncate">
                    {cleanGitUrl(gitRepo.url)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="section-label">Repository</span>
                {gitRepo.url && (
                  <a
                    href={gitWebUrl(gitRepo.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={gitRepo.url}
                    className="flex min-w-0 items-center gap-1 text-xs font-mono text-secondary transition-colors hover:text-primary"
                  >
                    <span className="truncate">{gitRepo.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="section-label">SSH Key</p>
                <button
                  onClick={() => setShowSshKeyEditor(true)}
                  className="flex items-center gap-1 text-xs font-bold text-secondary transition-colors hover:text-primary"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Rotate
                </button>
              </div>
              {/* The key is write-only: the API returns a fingerprint instead
                  of key material, so there is nothing left to reveal. The
                  fingerprint is the same SHA256 your Git provider shows next to
                  the deploy key, which is what makes it useful here. */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-elevated border border-border">
                <Key className="w-4 h-4 text-tertiary shrink-0" />
                <p className="text-xs font-mono flex-1 min-w-0 truncate text-secondary">
                  {gitRepo.sshKeyConfigured
                    ? gitRepo.sshKeyFingerprint || "Configured"
                    : "Not configured"}
                </p>
              </div>
              {gitRepo.sshKeyConfigured && (
                <p className="mt-2 text-xs text-tertiary">
                  Compare this fingerprint with the deploy key in your Git
                  provider to confirm it is the right one.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Terraform Backend */}
        {tfEnabled && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary-muted border border-primary shrink-0">
                  <Database className="w-6 h-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-primary truncate">
                    Terraform Backend
                  </h4>
                  <p className="text-xs font-mono text-tertiary truncate">
                    {tfBackend.bucketName || "—"}
                  </p>
                </div>
              </div>
              {tfBackend.bucketName && (
                <a
                  href={`https://${environment.region}.console.aws.amazon.com/s3/buckets/${tfBackend.bucketName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in AWS Console"
                  className="p-2 -mr-1 rounded-lg shrink-0 text-tertiary transition-colors hover:text-primary hover:bg-surface-elevated"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
              <span className="section-label">Locking Mechanism</span>
              <span className="text-sm font-medium text-primary">
                {lockingLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Rotate SSH Key modal */}
      {showSshKeyEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSshKeyEditor(false);
              setNewSshKey("");
            }}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl bg-surface border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center space-x-3">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-2xl font-extrabold text-primary">
                  Rotate SSH Key
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSshKeyEditor(false);
                  setNewSshKey("");
                }}
                className="p-1.5 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-secondary">
                Paste the new SSH private key for{" "}
                <span className="font-mono font-medium">
                  {cleanGitUrl(gitRepo?.url)}
                </span>
              </p>
              <textarea
                value={newSshKey}
                onChange={(e) => setNewSshKey(e.target.value)}
                rows={8}
                placeholder="Paste your SSH private key here..."
                className="w-full px-4 py-3 rounded-lg border font-mono text-xs resize-none transition-colors bg-background border-border text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSshKeyEditor(false);
                    setNewSshKey("");
                  }}
                  className="btn-op-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateSshKey}
                  disabled={isSavingSshKey || !newSshKey.trim()}
                  className="btn-op-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSshKey ? "Saving..." : "Update Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExternalResources;
