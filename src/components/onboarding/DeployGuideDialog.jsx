import { useEffect, useState } from "react";
import { ExternalLink, Rocket, X } from "lucide-react";
import CopyButton from "./CopyButton";
import { githubPages } from "../../utils/repoAddress";
import {
  AWS_CLOUDSHELL_URL,
  AWS_CONNECT_COMMAND,
  parseConnectLine,
} from "../../utils/awsQuickConnect";
import { generateSshKeyPair } from "../../utils/sshKeyPair";

// Step 5 of the setup guide (OP-283): what the generated pipeline needs on
// GitHub before it deploys, with every page linked and every value one click
// from the clipboard. The pipeline (templates/.github/workflows/
// terraform-deploy.yml) reads three repository secrets: the AWS key, and the
// private half of a read-only deploy key Argo CD pulls the repository with
// (OP-265; the Kubernetes stack always runs and requires it). An apply stops
// twice for approval, AWS first, then Kubernetes; each request is a GitHub
// issue that expires after 55 minutes (templates/.github/scripts/
// wait-for-approval.sh).
//
// Nothing secret is kept: the AWS line is split in the browser, and the Argo
// CD key exists only while this dialog is open.

const LinkButton = ({ href, children }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-op-primary"
    >
      {children}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  ) : null;

const Section = ({ number, title, children }) => (
  <li className="space-y-3">
    <h3 className="text-sm font-bold text-primary">
      {number}. {title}
    </h3>
    {children}
  </li>
);

const DeployGuideDialog = ({
  isOpen,
  repoUrl,
  rememberedAwsKey,
  onClose,
  onDone,
}) => {
  const [line, setLine] = useState("");
  const [argoKey, setArgoKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [showCommand, setShowCommand] = useState(false);
  const [pasting, setPasting] = useState(false);
  // The key connected in step 1 of the guide, if this page still has it;
  // a line pasted here takes its place.
  const aws =
    parseConnectLine(line) || (line.trim() ? null : rememberedAwsKey || null);
  const askForLine = !rememberedAwsKey || pasting;
  const pages = githubPages(repoUrl);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Closed means forgotten: the line carries the AWS secret.
  useEffect(() => {
    if (isOpen) return;
    setLine("");
    setArgoKey(null);
    setKeyError("");
    setShowCommand(false);
    setPasting(false);
  }, [isOpen]);

  const createArgoKey = async () => {
    setGenerating(true);
    setKeyError("");
    try {
      setArgoKey(await generateSshKeyPair());
    } catch (error) {
      setKeyError(error.message || "The key could not be created.");
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  const secrets = [
    {
      name: "AWS_ACCESS_KEY_ID",
      value: aws?.accessKey,
      shown: aws?.accessKey || "From the line above",
    },
    {
      name: "AWS_SECRET_ACCESS_KEY",
      value: aws?.secretKey,
      shown: aws ? "••••••••••••" : "From the line above",
    },
    {
      name: "TF_VAR_GIT_REPO_SSH_KEY",
      value: argoKey?.privateKey,
      shown: argoKey ? "Argo CD private key" : "Create it in step 1",
    },
  ];

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deploy-guide-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2
            id="deploy-guide-title"
            className="flex items-center gap-2 text-xl font-bold text-primary"
          >
            <Rocket className="h-6 w-6 text-accent" aria-hidden="true" />
            Start the deployment
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-tertiary hover:bg-surface-elevated hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-6">
          <p className="text-sm text-secondary">
            Your repository&apos;s pipeline builds everything in your AWS
            account. It needs a few things on GitHub first. Keep this window
            open until you are done.
          </p>
          {!pages && (
            <p className="mt-3 text-sm text-warning">
              Your repository is not on github.com, so there are no links here.
              The steps are the same with your Git provider.
            </p>
          )}

          <ol className="mt-6 space-y-7">
            <Section number={1} title="Let Argo CD read your repository">
              <p className="text-sm text-secondary">
                Argo CD runs in your cluster and reads the repository with a key
                of its own. OpenPrime creates it here.
              </p>
              {argoKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-secondary">
                      {argoKey.publicKey}
                    </code>
                    <CopyButton
                      value={argoKey.publicKey}
                      label="Copy the Argo CD public key"
                    />
                  </div>
                  <LinkButton href={pages?.deployKeysNew}>
                    Open deploy keys
                  </LinkButton>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-secondary">
                    <li>Title: argocd. Paste the key into the Key box.</li>
                    {/* The opposite of OpenPrime's own key: this one must
                        not be able to push. */}
                    <li className="rounded-md bg-warning-muted px-1.5 py-1 text-primary">
                      <strong className="text-warning">
                        Leave Allow write access unticked.
                      </strong>{" "}
                      Argo CD only reads.
                    </li>
                    <li>Click Add key.</li>
                  </ol>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={createArgoKey}
                  disabled={generating}
                  className="btn-op-secondary"
                >
                  {generating ? "Creating the key…" : "Create the Argo CD key"}
                </button>
              )}
              {keyError && (
                <p role="alert" className="text-sm text-danger">
                  {keyError}
                </p>
              )}
            </Section>

            <Section number={2} title="Give the pipeline its three secrets">
              {askForLine ? (
                <>
                  <label
                    htmlFor="deploy-guide-line"
                    className="block text-sm text-secondary"
                  >
                    Paste the line the AWS command printed in step 1 of the
                    guide. It is still in your AWS terminal. It is only split
                    here, never saved.
                  </label>
                  <input
                    id="deploy-guide-line"
                    type="password"
                    autoComplete="off"
                    value={line}
                    onChange={(event) => setLine(event.target.value)}
                    placeholder="openprime:123456789012:AKIA…"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-primary"
                  />
                  {line.trim() && !aws && (
                    <p className="text-sm text-danger">
                      That is not the line the command prints. Copy the whole
                      line that starts with openprime:
                    </p>
                  )}
                  <p className="text-xs text-tertiary">
                    Lost it?{" "}
                    <button
                      type="button"
                      onClick={() => setShowCommand((open) => !open)}
                      aria-expanded={showCommand}
                      className="font-semibold text-accent hover:underline"
                    >
                      Run the AWS command again
                    </button>
                    . It makes a new key and prints a new line.
                  </p>
                  {showCommand && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={AWS_CLOUDSHELL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-op-secondary"
                      >
                        Open AWS CloudShell
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <CopyButton
                        value={AWS_CONNECT_COMMAND}
                        label="Copy the AWS command"
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-success">
                  The AWS key from step 1 is filled in below. It is kept only
                  while this page is open.
                  <button
                    type="button"
                    onClick={() => setPasting(true)}
                    className="font-semibold text-accent hover:underline"
                  >
                    Paste a different line
                  </button>
                </p>
              )}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-tertiary">
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Secret</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secrets.map((secret) => (
                      <tr key={secret.name} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-primary">{secret.name}</code>
                            <CopyButton
                              value={secret.name}
                              label={`Copy the name ${secret.name}`}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-secondary">
                              {secret.shown}
                            </span>
                            <CopyButton
                              value={secret.value}
                              label={`Copy the secret for ${secret.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <LinkButton href={pages?.secretsNew}>Open New secret</LinkButton>
              <p className="text-sm text-secondary">
                For each row: paste the name, paste the secret, click Add
                secret. Then open the page again for the next row.
              </p>
            </Section>

            <Section number={3} title="Start the pipeline">
              <LinkButton href={pages?.workflow}>
                Open Terraform Deployment
              </LinkButton>
              {/* Labels as GitHub shows them for this workflow's
                  workflow_dispatch inputs (terraform-deploy.yml). */}
              <ol className="list-decimal space-y-1 pl-5 text-sm text-secondary">
                <li>
                  Click <strong className="text-primary">Run workflow</strong>{" "}
                  on the right, above the list of runs.
                </li>
                <li>Leave the branch as it is.</li>
                <li>
                  Under{" "}
                  <strong className="text-primary">
                    Terraform action to run
                  </strong>
                  , choose <strong className="text-primary">apply</strong>.
                </li>
                <li>
                  Leave{" "}
                  <strong className="text-primary">
                    Destroy without taking a final DB snapshot
                  </strong>{" "}
                  unticked.
                </li>
                <li>
                  Click the green{" "}
                  <strong className="text-primary">Run workflow</strong> button.
                </li>
              </ol>
              <p className="text-xs text-tertiary">
                The run shows up in the list after a few seconds. It prepares a
                plan first, then waits for your approval.
              </p>
            </Section>

            <Section number={4} title="Approve it, twice">
              <LinkButton href={pages?.issues}>Open issues</LinkButton>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-secondary">
                <li>
                  Open the issue{" "}
                  <strong className="text-primary">
                    Approve Terraform apply (AWS)
                  </strong>
                  . It appears a few minutes after the start, once the plan is
                  ready.
                </li>
                <li>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    Post this comment:
                    <code className="rounded-lg border border-border bg-background px-2 py-1 text-primary">
                      approve
                    </code>
                    <CopyButton value="approve" label="Copy approve" />
                  </span>
                </li>
                <li>
                  When the AWS part is built (with a cluster this takes 15
                  minutes or more), a second issue appears:{" "}
                  <strong className="text-primary">
                    Approve Terraform apply (Kubernetes)
                  </strong>
                  . Approve it the same way.
                </li>
              </ol>
              <p className="text-xs text-tertiary">
                Each request expires after 55 minutes.
              </p>
            </Section>
          </ol>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border p-6">
          <button type="button" onClick={onClose} className="btn-op-secondary">
            Close
          </button>
          <button type="button" onClick={onDone} className="btn-op-primary">
            Both approved, done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeployGuideDialog;
