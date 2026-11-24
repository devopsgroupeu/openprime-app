import { RelativeTime } from "@/components/shared/format";
import { CopyButton } from "@/components/shared/copy-button";
import { SettingsSection, StatCard } from "@/components/shared/settings";
import { modifiedAt, regionOf } from "../../utils/environmentStats";
import { DetailList, DetailRow, Mono, NotConfigured } from "./DetailList";
import { regionName } from "./EnvironmentConfiguration";
import {
  OpenLink,
  cleanGitUrl,
  gitRepositoryOf,
  gitWebUrl,
  s3ConsoleUrl,
  terraformBackendOf,
} from "./ExternalResources";
import { ServicesPreview } from "./ServicesList";

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
  const modified = modifiedAt(environment);
  const web = gitWebUrl(gitRepo?.url);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard compact label="Services" value={serviceCount} />
        <StatCard compact label="Helm charts" value={chartCount} />
        <StatCard
          compact
          label="Region"
          value={regionOf(environment) || "None"}
          hint={regionName(environment)}
        />
        <StatCard
          compact
          label="Modified"
          value={modified ? <RelativeTime iso={modified} /> : "Never"}
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
