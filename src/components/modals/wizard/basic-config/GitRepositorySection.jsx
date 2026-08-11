import { GitBranch, AlertTriangle } from "lucide-react";

// Git repository card of the wizard's Basic Configuration step.
// Presentational: env state is owned by the parent BasicConfigStep.
const GitRepositorySection = ({ newEnv, setNewEnv }) => {
  const keyAlreadyConfigured = Boolean(newEnv.gitRepository?.sshKeyConfigured);

  return (
    <div className="p-6 rounded-2xl border bg-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-accent" />
          <label className="text-sm font-semibold text-label">
            Git Repository (Optional)
          </label>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={newEnv.gitRepository?.enabled || false}
            onChange={(e) =>
              setNewEnv({
                ...newEnv,
                gitRepository: {
                  ...newEnv.gitRepository,
                  enabled: e.target.checked,
                  url: newEnv.gitRepository?.url || "",
                  branch: newEnv.gitRepository?.branch || "main",
                  sshKey: newEnv.gitRepository?.sshKey || "",
                },
              })
            }
          />
          <div className="w-11 h-6 rounded-full peer transition-colors bg-border-strong peer-checked:bg-primary">
            <div
              className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform ${
                newEnv.gitRepository?.enabled ? "translate-x-5" : ""
              }`}
            ></div>
          </div>
        </label>
      </div>

      <p className="text-xs mb-4 text-tertiary">
        Configure Git repository for infrastructure code storage and version
        control
      </p>

      {newEnv.gitRepository?.enabled && (
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-semibold text-label block mb-2">
              Repository URL
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 transition-colors"
              placeholder="git@github.com:organization/repository.git"
              value={newEnv.gitRepository?.url || ""}
              onChange={(e) =>
                setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    url: e.target.value,
                  },
                })
              }
            />
            <p className="text-xs mt-1 text-tertiary">
              SSH URL of the Git repository for infrastructure code
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-label block mb-2">
              Target Branch / Revision
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 transition-colors"
              placeholder="main"
              value={newEnv.gitRepository?.branch || ""}
              onChange={(e) =>
                setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    branch: e.target.value,
                  },
                })
              }
            />
            <p className="text-xs mt-1 text-tertiary">
              Branch or Git revision ArgoCD will track (e.g. main, HEAD, v1.2.0)
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-label block mb-2">
              SSH Private Key (Deploy Key)
            </label>
            <textarea
              className="w-full px-4 py-2 font-mono text-xs transition-colors"
              placeholder={
                keyAlreadyConfigured
                  ? "Leave blank to keep the current key"
                  : "Paste your SSH private key here"
              }
              rows={8}
              value={newEnv.gitRepository?.sshKey || ""}
              onChange={(e) =>
                setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    sshKey: e.target.value,
                  },
                })
              }
            />
            {/* On an edit the API returns a fingerprint rather than the key, so
                this field is legitimately empty for an environment that has one.
                Without saying so it reads as "no key configured". */}
            {keyAlreadyConfigured ? (
              <p className="text-xs mt-1 text-tertiary">
                A key is already configured
                {newEnv.gitRepository.sshKeyFingerprint
                  ? ` (${newEnv.gitRepository.sshKeyFingerprint})`
                  : ""}
                . Leave this blank to keep it, or paste a new key to replace it.
              </p>
            ) : (
              <p className="text-xs mt-1 text-tertiary">
                Private SSH key with write access to the repository
              </p>
            )}
          </div>

          {/* Deployment prerequisite callout */}
          <div className="p-5 rounded-xl border mb-4 bg-warning-muted border-warning text-warning">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
              <div className="space-y-3 min-w-0">
                <div>
                  <p className="text-sm font-bold mb-0.5">
                    Deployment Prerequisites
                  </p>
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  To enable automated infrastructure deployment via CI/CD, the
                  following secrets must be configured within your
                  repository&apos;s environment variables. These credentials
                  allow the pipeline to authenticate with your cloud provider
                  and securely access private Git resources.
                </p>

                <ul className="text-[11px] space-y-2 list-none">
                  <li className="leading-relaxed">
                    <code className="px-1 py-0.5 rounded font-mono bg-background">
                      AWS_ACCESS_KEY_ID
                    </code>{" "}
                    &{" "}
                    <code className="px-1 py-0.5 rounded font-mono bg-background">
                      AWS_SECRET_ACCESS_KEY
                    </code>
                    <span className="block mt-1 opacity-80">
                      IAM credentials with the necessary permissions to
                      provision and manage the resources.
                    </span>
                  </li>
                  <li className="leading-relaxed">
                    <code className="px-1 py-0.5 rounded font-mono bg-background">
                      TF_VAR_git_repo_ssh_key
                    </code>
                    <span className="block mt-1 opacity-80">
                      A private SSH key (Deployment Key) used by Terraform and
                      ArgoCD to authenticate against private repositories.
                    </span>
                  </li>
                </ul>

                <div className="p-2 rounded text-[11px] border bg-background border-border">
                  <span className="font-bold mr-1 uppercase text-[10px]">
                    Security Note:
                  </span>
                  <span className="italic opacity-90">
                    These variables must be stored as encrypted Secrets (e.g.,
                    GitHub Actions Secrets) and should never be logged or
                    committed to source control.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitRepositorySection;
