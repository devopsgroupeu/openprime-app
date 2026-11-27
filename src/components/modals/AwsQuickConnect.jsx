import { useEffect, useState } from "react";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import {
  AWS_CLOUDSHELL_URL,
  AWS_CONNECT_COMMAND,
  parseConnectLine,
} from "../../utils/awsQuickConnect";
import { useOnboarding } from "../../contexts/OnboardingContext";

// Three steps a person without IAM knowledge can follow: open the AWS terminal,
// paste one command, paste back the one line it prints (OP-284, v1).
const AwsQuickConnect = ({ onSave, onUseKeys }) => {
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const parsed = parseConnectLine(pasted);
  const recognized = Boolean(parsed);

  // The setup guide follows these three steps while the dialog is open.
  const setGuideProgress = useOnboarding()?.setAwsProgress;
  useEffect(() => {
    setGuideProgress?.({ opened, copied, parsed: recognized });
  }, [setGuideProgress, opened, copied, recognized]);
  useEffect(() => () => setGuideProgress?.(null), [setGuideProgress]);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(AWS_CONNECT_COMMAND);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const connect = (e) => {
    e.preventDefault();
    if (!parsed) return;
    onSave({
      provider: "aws",
      name: `AWS ${parsed.accountId}`,
      identifier: parsed.accountId,
      isDefault: true,
      credentials: {
        accessKey: parsed.accessKey,
        secretKey: parsed.secretKey,
      },
    });
  };

  return (
    <form onSubmit={connect} className="p-6 space-y-5">
      <ol className="space-y-5">
        <li>
          <h3 className="text-sm font-bold text-primary">
            1. Open the AWS terminal
          </h3>
          <p className="text-sm text-secondary mt-1">
            Sign in to your AWS account. A terminal called CloudShell opens.
          </p>
          <a
            href={AWS_CLOUDSHELL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpened(true)}
            data-guide="aws-open-cloudshell"
            className="btn-op-secondary mt-2"
          >
            Open AWS CloudShell
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </li>

        <li>
          <h3 className="text-sm font-bold text-primary">
            2. Copy this command, paste it into the terminal and press Enter
          </h3>
          <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-border bg-background p-3 text-[11px] leading-relaxed text-secondary">
            {AWS_CONNECT_COMMAND}
          </pre>
          <button
            type="button"
            onClick={copyCommand}
            data-guide="aws-copy-command"
            className="btn-op-primary mt-2"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy command"}
          </button>
        </li>

        <li>
          <label
            htmlFor="aws-connect-line"
            className="block text-sm font-bold text-primary"
          >
            3. Paste the line it prints, starting with openprime:
          </label>
          <input
            id="aws-connect-line"
            data-guide="aws-paste-line"
            type="password"
            autoComplete="off"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="openprime:123456789012:AKIA…"
            className="w-full mt-2 px-4 py-2 rounded-lg border bg-background border-border text-primary"
          />
          {parsed ? (
            <p className="flex items-center gap-1.5 text-sm text-success mt-1.5">
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              AWS account {parsed.accountId} recognized
            </p>
          ) : (
            pasted.trim() && (
              <p className="text-sm text-danger mt-1.5">
                That is not the line the command prints. Copy the whole line
                that starts with openprime:
              </p>
            )
          )}
        </li>
      </ol>

      <p className="text-xs text-tertiary">
        The command creates a user called openprime with full access to this AWS
        account, so OpenPrime and your pipeline can build infrastructure in it.
        Use an AWS account meant for this.
      </p>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onUseKeys}
          className="text-sm font-semibold text-accent hover:underline"
        >
          I already have an access key
        </button>
        <button
          type="submit"
          disabled={!parsed}
          data-guide="aws-connect"
          className="btn-op-primary"
        >
          Connect
        </button>
      </div>
    </form>
  );
};

export default AwsQuickConnect;
