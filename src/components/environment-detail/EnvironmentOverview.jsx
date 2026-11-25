import { RelativeTime } from "@/components/shared/format";
import { CopyButton } from "@/components/shared/copy-button";
import { SettingsSection, StatCard } from "@/components/shared/settings";
import { DetailList, DetailRow, Mono, NotConfigured } from "./DetailList";
import {
  OpenLink,
  cleanGitUrl,
  gitRepositoryOf,
  gitWebUrl,
  s3ConsoleUrl,
  terraformBackendOf,
} from "./ExternalResources";
import { ServicesPreview } from "./ServicesList";

// When a job last ran: "5 days ago", "Failed" over the time, or "Never".
function LastJob({ label, at, status }) {
  if (!at) return <StatCard compact label={label} value="Never" />;
  return status === "failed" ? (
    <StatCard
      compact
      label={label}
      value="Failed"
      hint={<RelativeTime iso={at} />}
    />
  ) : (
    <StatCard compact label={label} value={<RelativeTime iso={at} />} />
  );
}

/** Overview: the numbers, where the code goes, and the first services. */
export default function EnvironmentOverview({
  environment,
  serviceCount,
  chartCount,
  basePath,
}) {
  const editHref = `${basePath}/edit`;
  const gitRepo = gitRepositoryOf(environment);
  const tfBackend = terraformBackendOf(environment);
  const credential = environment.cloudCredential;
  const web = gitWebUrl(gitRepo?.url);
  // Helm charts run on EKS; without it the count says nothing.
  const eks = Boolean(environment.services?.eks?.enabled);
  return (
    <>
      <div
        className={`grid grid-cols-2 gap-2 sm:gap-4 ${eks ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
      >
        <StatCard compact label="Services" value={serviceCount} />
        {eks ? (
          <StatCard compact label="Helm charts" value={chartCount} />
        ) : null}
        <LastJob
          label="Last generated"
          at={environment.last_generate_at}
          status={environment.last_generate_status}
        />
        <LastJob
          label="Last pushed"
          at={environment.last_push_at}
          status={environment.last_push_status}
        />
      </div>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <SettingsSection
          title="Delivery"
          description="Where the generated code and the Terraform state go."
        >
          <DetailList>
            <DetailRow
              label="Git repository"
              actions={
                gitRepo?.enabled ? (
                  <>
                    <CopyButton
                      text={gitRepo.url}
                      label="Copy repository URL"
                    />
                    {web ? (
                      <OpenLink href={web} label="Open repository" />
                    ) : null}
                  </>
                ) : null
              }
            >
              {gitRepo?.enabled ? (
                <Mono title={gitRepo.url}>{cleanGitUrl(gitRepo.url)}</Mono>
              ) : (
                <NotConfigured editHref={editHref} />
              )}
            </DetailRow>
            {gitRepo?.enabled && gitRepo.branch ? (
              <DetailRow label="Branch">
                <Mono>{gitRepo.branch}</Mono>
              </DetailRow>
            ) : null}
            <DetailRow
              label="Terraform state bucket"
              actions={
                tfBackend?.enabled && tfBackend.bucketName ? (
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
              {tfBackend?.enabled ? (
                <Mono>{tfBackend.bucketName || "Not set"}</Mono>
              ) : (
                <NotConfigured editHref={editHref} />
              )}
            </DetailRow>
            <DetailRow label="Credentials">
              {credential ? (
                <p className="truncate">
                  {credential.name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {credential.identifier}
                  </span>
                </p>
              ) : (
                <NotConfigured editHref={editHref} />
              )}
            </DetailRow>
            <DetailRow label="Domain">
              {environment.domain ? (
                <Mono>{environment.domain}</Mono>
              ) : (
                <NotConfigured editHref={editHref} />
              )}
            </DetailRow>
          </DetailList>
        </SettingsSection>
        <ServicesPreview
          environment={environment}
          servicesHref={`${basePath}?tab=services`}
        />
      </div>
    </>
  );
}
