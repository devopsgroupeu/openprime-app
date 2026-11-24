import { useId, useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";
import { DetailList, DetailRow, Mono, NotConfigured } from "./DetailList";
import { CopyButton } from "@/components/shared/copy-button";
import { SettingsSection } from "@/components/shared/settings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const gitRepositoryOf = (env) => env.git_repository || env.gitRepository;
export const terraformBackendOf = (env) =>
  env.terraform_backend || env.terraformBackend;

export const cleanGitUrl = (url) =>
  (url || "")
    .replace("git@github.com:", "")
    .replace("git@gitlab.com:", "")
    .replace(/\.git$/, "");

// https URL of a GitHub or GitLab repository, else null.
export const gitWebUrl = (url) => {
  const web = (url || "")
    .replace("git@github.com:", "https://github.com/")
    .replace("git@gitlab.com:", "https://gitlab.com/")
    .replace(/\.git$/, "");
  return web.startsWith("https://") ? web : null;
};

export const s3ConsoleUrl = (region, bucket) =>
  `https://${region}.console.aws.amazon.com/s3/buckets/${bucket}`;

/** Icon link that opens `href` in a new tab. */
export function OpenLink({ href, label }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" asChild>
          <a href={href} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            <span className="sr-only">{label}</span>
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function RotateSshKeyDialog({ environment, gitRepo, onClose, onUpdated }) {
  const { success, error: showError } = useToast();
  const id = useId();
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      const updated = await authService.put(`/environments/${environment.id}`, {
        ...environment,
        gitRepository: { ...gitRepo, sshKey: key.trim() },
      });
      onUpdated?.(updated);
      onClose();
      success("SSH key updated.");
    } catch (err) {
      console.error("Failed to update SSH key:", err);
      showError(err.message || "Couldn't update the SSH key.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rotate SSH key</DialogTitle>
          <DialogDescription>
            Paste the new private key for{" "}
            <span className="font-mono">{cleanGitUrl(gitRepo.url)}</span>.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={id}>SSH private key</FieldLabel>
          <Textarea
            id={id}
            autoFocus
            rows={8}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
            spellCheck="false"
            className="field-sizing-fixed resize-none font-mono text-xs md:text-xs"
          />
        </Field>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !key.trim()}>
            {saving ? <Spinner aria-hidden /> : null}
            Update key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Configuration tab: where the code is pushed and the Terraform state kept. */
const ExternalResources = ({ environment, onEnvironmentUpdate, editHref }) => {
  const [rotating, setRotating] = useState(false);
  const gitRepo = gitRepositoryOf(environment);
  const tfBackend = terraformBackendOf(environment);
  const web = gitWebUrl(gitRepo?.url);
  const locking =
    tfBackend?.lockingMechanism === "s3"
      ? "S3 native"
      : tfBackend?.lockingMechanism;

  return (
    <>
      <SettingsSection
        title="Git repository"
        description="Push to git commits the generated code here over SSH."
      >
        <DetailList>
          {gitRepo?.enabled ? (
            <>
              <DetailRow
                label="Repository"
                actions={
                  <>
                    <CopyButton
                      text={gitRepo.url}
                      label="Copy repository URL"
                    />
                    {web ? (
                      <OpenLink href={web} label="Open repository" />
                    ) : null}
                  </>
                }
              >
                <Mono>{gitRepo.url}</Mono>
              </DetailRow>
              {gitRepo.branch ? (
                <DetailRow
                  label="Branch"
                  actions={
                    <CopyButton text={gitRepo.branch} label="Copy branch" />
                  }
                >
                  <Mono>{gitRepo.branch}</Mono>
                </DetailRow>
              ) : null}
              {/* The key is write-only: the API returns a fingerprint instead
                  of key material. It is the same SHA256 your Git provider shows
                  next to the deploy key, which is what makes it useful here. */}
              <DetailRow
                label="SSH key"
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRotating(true)}
                  >
                    <KeyRound aria-hidden />
                    Rotate
                  </Button>
                }
              >
                {gitRepo.sshKeyConfigured ? (
                  <>
                    <Mono>{gitRepo.sshKeyFingerprint || "Configured"}</Mono>
                    <p className="text-xs text-muted-foreground">
                      Compare it with the deploy key in your Git provider.
                    </p>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not configured</span>
                )}
              </DetailRow>
            </>
          ) : (
            <DetailRow label="Repository">
              <NotConfigured editHref={editHref} />
            </DetailRow>
          )}
        </DetailList>
      </SettingsSection>

      <SettingsSection
        title="Terraform state"
        description="The S3 bucket that keeps this environment's Terraform state."
      >
        <DetailList>
          {tfBackend?.enabled ? (
            <>
              <DetailRow
                label="Bucket"
                actions={
                  tfBackend.bucketName ? (
                    <>
                      <CopyButton
                        text={tfBackend.bucketName}
                        label="Copy bucket name"
                      />
                      <OpenLink
                        href={s3ConsoleUrl(
                          environment.region,
                          tfBackend.bucketName,
                        )}
                        label="Open in the AWS console"
                      />
                    </>
                  ) : null
                }
              >
                {tfBackend.bucketName ? (
                  <Mono>{tfBackend.bucketName}</Mono>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </DetailRow>
              {locking ? (
                <DetailRow label="State locking">{locking}</DetailRow>
              ) : null}
              {tfBackend.tableName ? (
                <DetailRow label="Lock table">
                  <Mono>{tfBackend.tableName}</Mono>
                </DetailRow>
              ) : null}
            </>
          ) : (
            <DetailRow label="Bucket">
              <NotConfigured editHref={editHref} />
            </DetailRow>
          )}
        </DetailList>
      </SettingsSection>

      {rotating ? (
        <RotateSshKeyDialog
          environment={environment}
          gitRepo={gitRepo}
          onClose={() => setRotating(false)}
          onUpdated={onEnvironmentUpdate}
        />
      ) : null}
    </>
  );
};

export default ExternalResources;
