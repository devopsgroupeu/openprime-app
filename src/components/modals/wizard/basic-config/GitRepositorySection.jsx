import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { gitHost, gitLogo } from "../../../../config/logos";
import { LogoTile } from "@/components/shared/logo-tile";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSection,
} from "@/components/shared/settings";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { FieldControl, invalidProps } from "./FieldControl";
import SshKeyTabs from "./SshKeyTabs";

const Code = ({ children }) => (
  <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">
    {children}
  </code>
);

// The repository secrets the generated pipeline reads, closed by default.
function CiRequirements({ isGitLab, isGitLabCom }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 p-3.5 text-left text-sm font-medium outline-none transition-[background-color] duration-(--dur-fast) hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <ChevronRight
          aria-hidden
          className="size-4 text-muted-foreground transition-transform duration-(--dur-fast) group-data-[state=open]:rotate-90"
        />
        What your CI needs
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 px-3.5 pb-3.5 pl-9.5 text-sm">
        <p className="text-muted-foreground">
          The generated pipeline deploys with these secrets. Add them to your
          repository&apos;s CI/CD variables.
        </p>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <dt>
              <Code>AWS_ACCESS_KEY_ID</Code> and{" "}
              <Code>AWS_SECRET_ACCESS_KEY</Code>
            </dt>
            <dd className="text-muted-foreground">
              IAM credentials with the permissions to provision and manage the
              resources.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt>
              <Code>TF_VAR_git_repo_ssh_key</Code>
            </dt>
            <dd className="text-muted-foreground">
              The private key of a second, read-only deploy key that Argo CD
              uses to pull this repository. Do not reuse the key above: it can
              push. Create one with{" "}
              <Code>
                ssh-keygen -t ed25519 -N &quot;&quot; -f argocd-deploy-key
              </Code>{" "}
              and add argocd-deploy-key.pub as a deploy key without write
              access.
            </dd>
          </div>
        </dl>
        {isGitLab && (
          <div className="flex flex-col gap-1">
            <p className="font-medium">On GitLab</p>
            <p className="text-muted-foreground">
              CI/CD variables are protected by default, so they only reach
              protected branches. Protect the branch you deploy from (Settings
              &gt; Repository &gt; Protected branches), or clear &quot;Protect
              variable&quot; on these variables.
            </p>
            {isGitLabCom && (
              <p className="text-muted-foreground">
                New gitlab.com accounts must verify their identity (phone or
                card) before GitLab runs any pipeline. Until then the first
                pipeline shows as failed with 0 jobs.
              </p>
            )}
          </div>
        )}
        <p className="text-muted-foreground">
          Store them as encrypted secrets, for example GitHub Actions secrets.
          Never log them or commit them to the repository.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Git repository section of the wizard's Basics step. Presentational: env
// state is owned by the parent BasicConfigStep; `urlError` is the Basics
// error of an empty URL while the section is on.
const GitRepositorySection = ({ newEnv, setNewEnv, sshKeys, urlError }) => {
  const id = useId();
  const git = newEnv.gitRepository;
  // Self-hosted GitLab is recognised only by "gitlab" in its host name.
  const host = gitHost(git?.url);
  const isGitLab = host.includes("gitlab");
  const isGitLabCom = host === "gitlab.com";
  const setGit = (changes) =>
    setNewEnv({ ...newEnv, gitRepository: { ...git, ...changes } });

  return (
    <SettingsSection
      title="Git repository"
      description="Needed for Push to git and for Helm charts (Argo CD pulls from it)."
      action={
        <Switch
          aria-label="Push to a git repository"
          checked={git?.enabled || false}
          onCheckedChange={(checked) =>
            setGit({
              enabled: checked,
              url: git?.url || "",
              branch: git?.branch || "main",
              sshKey: git?.sshKey || "",
            })
          }
        />
      }
    >
      {git?.enabled && (
        <SettingsRowGroup>
          <SettingsRow
            title="Repository URL"
            controlId={`${id}-url`}
            description="The SSH URL OpenPrime pushes to."
            control={
              <FieldControl id={`${id}-url`} error={urlError}>
                {/* The provider's logo once the host is GitHub or GitLab. */}
                <InputGroup>
                  <InputGroupAddon>
                    <LogoTile {...gitLogo(git?.url)} size="xs" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={`${id}-url`}
                    className="font-mono"
                    placeholder="git@github.com:org/repo.git"
                    value={git?.url || ""}
                    {...invalidProps(`${id}-url`, urlError)}
                    onChange={(e) => setGit({ url: e.target.value })}
                  />
                </InputGroup>
              </FieldControl>
            }
          />
          <SettingsRow
            title="Branch or revision"
            controlId={`${id}-branch`}
            description="What Argo CD tracks, e.g. main, HEAD or v1.2.0."
            control={
              <Input
                id={`${id}-branch`}
                className="font-mono sm:w-72"
                placeholder="main"
                value={git?.branch || ""}
                onChange={(e) => setGit({ branch: e.target.value })}
              />
            }
          />
          <SettingsRow
            fullWidth
            title="Deploy key"
            description="OpenPrime pushes with this SSH key, so it needs write access."
            control={
              <div className="w-full">
                <SshKeyTabs sshKeys={sshKeys} gitRepository={git} />
              </div>
            }
          />
          <CiRequirements isGitLab={isGitLab} isGitLabCom={isGitLabCom} />
        </SettingsRowGroup>
      )}
    </SettingsSection>
  );
};

export default GitRepositorySection;
