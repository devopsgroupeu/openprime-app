import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import EnvironmentHeader, {
  JobCallout,
  NO_GIT,
} from "./environment-detail/EnvironmentHeader";
import EnvironmentOverview from "./environment-detail/EnvironmentOverview";
import ServicesList, {
  enabledServiceEntries,
} from "./environment-detail/ServicesList";
import HelmChartsList, {
  enabledCharts,
} from "./environment-detail/HelmChartsList";
import EnvironmentConfiguration from "./environment-detail/EnvironmentConfiguration";
import {
  cleanGitUrl,
  gitRepositoryOf,
  gitWebUrl,
} from "./environment-detail/ExternalResources";
import { getEffectiveStatus, lastJob } from "../utils/environmentStats";
import { PageShell } from "@/components/shared/page-shell";
import { useUnsavedGuard } from "@/components/shared/save-bar";
import { DetailPageSkeleton } from "@/components/shared/skeletons";
import { ErrorState, NotFound } from "@/components/shared/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { describeError, serverMessage } from "@/lib/describe-error";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "helm", label: "Helm charts" },
  { id: "configuration", label: "Configuration" },
];

// Async job model: POST returns 202 + jobId, then we poll GET /api/jobs/:jobId
// until the job reaches a terminal state (succeeded/failed/cancelled).
// Backoff: 2s for the first 8 polls (~16s), 5s for the next 12 (~60s), then
// 10s. Keeps total polls (~43) well under the backend jobs-route limiter
// while still covering ~5 min of background job execution.
const pollJob = async (jobId, mountedRef) => {
  const maxPolls = 45;
  const getPollInterval = (pollIndex) => {
    if (pollIndex < 8) return 2000;
    if (pollIndex < 20) return 5000;
    return 10000;
  };
  for (let i = 0; i < maxPolls; i++) {
    if (!mountedRef.current) return null;
    const job = await authService.get(`/jobs/${jobId}`);
    if (job.status === "succeeded") return job;
    // `jobFailed`: the backend stored this outcome on the environment.
    if (job.status === "failed")
      throw Object.assign(new Error(job.error || "Job failed"), {
        jobFailed: true,
      });
    if (job.status === "cancelled") throw new Error("Job was cancelled");
    await new Promise((resolve) => setTimeout(resolve, getPollInterval(i)));
  }
  throw new Error("Operation timed out. Check the job status later.");
};

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/** Route tabs: links with the tab in `?tab=` (Overview is the bare URL). */
function TabNav({ tabs, active, basePath }) {
  const activeLink = useRef(null);
  // The active tab stays visible in the scrolling tab row on phones.
  useEffect(() => {
    activeLink.current?.scrollIntoView?.({
      inline: "nearest",
      block: "nearest",
    });
  }, [active]);
  return (
    <nav
      aria-label="Environment sections"
      className="-mx-4 overflow-x-auto border-b px-4 md:mx-0 md:px-0"
    >
      <ul className="flex w-max gap-1">
        {tabs.map((tab) => {
          const current = tab.id === active;
          return (
            <li key={tab.id}>
              <Link
                ref={current ? activeLink : undefined}
                to={
                  tab.id === "overview" ? basePath : `${basePath}?tab=${tab.id}`
                }
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-1.5 border-b-2 border-transparent px-3 text-md font-medium text-muted-foreground outline-none lg:h-13",
                  "transition-[color,border-color] duration-(--dur-fast) hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  current && "border-foreground text-foreground",
                )}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EnvironmentDetail({ id, onDelete, onEnvironmentChange }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [reload, setReload] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPush, setConfirmPush] = useState(false);
  // The job this page runs: { kind, startedAt } while it polls, then
  // { kind, error } when it failed on this visit (announced; a failure stored
  // before the page opened is shown, not announced). Kind "download" fetches
  // the ZIP of a generated repository again (`downloadUrl`).
  const [job, setJob] = useState(null);
  const mountedRef = useRef(true);
  // One job at a time. A ref, not state: a second trigger that lands before
  // the next render (the buttons not disabled yet) is ignored too.
  const inFlight = useRef(false);
  const running = job && !job.error ? job.kind : null;
  // Leaving drops the download: polling is tied to this page being mounted.
  const leaveGuard = useUnsavedGuard(
    running === "generate" || running === "download",
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchEnvironment = async () => {
      if (id) {
        try {
          setLoading(true);
          setFetchError(null);
          const envData = await authService.get(`/environments/${id}`);
          setEnvironment(envData);
        } catch (err) {
          console.error("Failed to fetch environment:", err);
          setEnvironment(null);
          setFetchError({
            status: err.status,
            message: serverMessage(err),
            requestId: err.requestId,
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEnvironment();
  }, [id, reload]);

  // The list, the palette and the breadcrumb show the same environment.
  useEffect(() => {
    if (environment) onEnvironmentChange?.(environment);
  }, [environment]);

  if (loading) {
    return (
      <PageShell width="detail">
        <DetailPageSkeleton />
      </PageShell>
    );
  }

  if (!environment || fetchError) {
    return (
      <PageShell width="detail">
        {fetchError &&
        fetchError.status !== 404 &&
        fetchError.status !== 403 ? (
          <ErrorState
            thing="environment"
            message={fetchError.message}
            requestId={fetchError.requestId}
            onRetry={() => setReload((n) => n + 1)}
          />
        ) : (
          <NotFound thing="environment" />
        )}
      </PageShell>
    );
  }

  const basePath = `/environments/${environment.id}`;
  const services = enabledServiceEntries(environment);
  const charts = enabledCharts(environment);
  const gitRepo = gitRepositoryOf(environment);
  // Git switched on without a URL has nowhere to push to.
  const gitEnabled = Boolean(gitRepo?.enabled && gitRepo.url?.trim());
  const repoName = cleanGitUrl(gitRepo?.url);
  const repoWeb = gitWebUrl(gitRepo?.url);

  const tabs = TABS.filter((tab) => tab.id !== "helm" || charts.length > 0).map(
    (tab) =>
      tab.id === "services"
        ? { ...tab, count: services.length }
        : tab.id === "helm"
          ? { ...tab, count: charts.length }
          : tab,
  );
  const requested = params.get("tab");
  const active = tabs.some((tab) => tab.id === requested)
    ? requested
    : "overview";

  // The outcome, status and times the backend stored for a finished job.
  const refresh = async () => {
    try {
      const fresh = await authService.get(`/environments/${id}`);
      if (mountedRef.current) setEnvironment(fresh);
    } catch (err) {
      console.error("Failed to refresh the environment:", err);
    }
  };

  const failed = (kind, err, extra) =>
    setJob({
      kind,
      ...extra,
      error: {
        message: serverMessage(err),
        requestId: err.requestId,
      },
    });

  // A download that fails after a successful generate keeps its URL, so
  // Download again does not generate again.
  const download = async (downloadUrl, done) => {
    try {
      const blob = await authService.getBlob(downloadUrl);
      if (!mountedRef.current) return;
      triggerDownload(blob, `${environment.name}-infrastructure.zip`);
      toast.success(done);
      setJob(null);
    } catch (err) {
      console.error("Error downloading the repository:", err);
      if (mountedRef.current) failed("download", err, { downloadUrl });
    }
  };

  const downloadAgain = async (downloadUrl) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setJob({ kind: "download", startedAt: Date.now() });
    try {
      await download(downloadUrl, "Repository downloaded.");
    } finally {
      inFlight.current = false;
    }
  };

  const runJob = async (kind) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setJob({ kind, startedAt: Date.now() });
    try {
      const { jobId } = await authService.post(
        `/environments/${environment.id}/${kind}`,
        {},
        { headers: { "X-Async-Jobs": "true" } },
      );
      const result = await pollJob(jobId, mountedRef);
      if (result === null) return;
      await refresh();
      if (!mountedRef.current) return;
      if (kind === "generate") {
        if (!result.result?.downloadUrl) {
          throw new Error("Generated artifact is not available");
        }
        await download(
          result.result.downloadUrl,
          "Repository generated and downloaded.",
        );
        return;
      }
      toast.success(`Pushed to ${repoName}.`, {
        action: repoWeb
          ? {
              label: "Open repository",
              onClick: () =>
                window.open(repoWeb, "_blank", "noopener,noreferrer"),
            }
          : undefined,
      });
      setJob(null);
    } catch (err) {
      console.error(`Error running the ${kind} job:`, err);
      if (!mountedRef.current) return;
      // A failed job stored its outcome and status on the environment.
      if (err.jobFailed) await refresh();
      if (!mountedRef.current) return;
      // Shown in the callout (with Try again), not in a toast as well.
      failed(kind, err);
    } finally {
      inFlight.current = false;
    }
  };

  const last = lastJob(environment);
  // A job a worker has claimed (`deploying`) supersedes the stored failure.
  // The job buttons stay enabled then: the backend can leave `deploying`
  // behind, and enqueueing again re-attaches to the active job.
  const failure =
    job?.error ??
    (environment.status !== "deploying" &&
    last?.status === "failed" &&
    last.error
      ? { message: last.error }
      : null);
  const failedKind = job?.kind ?? last?.kind;
  // Pushing writes to the customer's branch: it asks first, also on Try again.
  const retry =
    failedKind === "download"
      ? () => downloadAgain(job.downloadUrl)
      : failedKind === "push"
        ? gitEnabled
          ? () => setConfirmPush(true)
          : undefined
        : () => runJob(failedKind);
  // Keyed by phase: a failure is a new alert, not the running callout's node
  // given role="alert" (not every screen reader announces that).
  const callout = running ? (
    <JobCallout key="running" kind={running} startedAt={job.startedAt} />
  ) : failure ? (
    <JobCallout
      key="failed"
      kind={failedKind}
      error={failure}
      onRetry={retry}
      note={retry ? undefined : NO_GIT}
      announce={Boolean(job?.error)}
    />
  ) : null;

  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(done);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };

  // The dialog closes after this returns, also after a failure (toasted here).
  const confirmDelete = async () => {
    try {
      await onDelete(environment.id);
      toast.success(`Deleted ${environment.name}.`);
      navigate("/environments");
    } catch (err) {
      toast.error(describeError(err, `delete ${environment.name}`));
    }
  };

  return (
    <PageShell width="detail">
      <EnvironmentHeader
        environment={environment}
        status={
          running && running !== "download"
            ? "deploying"
            : getEffectiveStatus(environment)
        }
        running={running}
        canPush={gitEnabled}
        onGenerate={() => runJob("generate")}
        onPush={() => setConfirmPush(true)}
        onCopyId={() => copy(environment.id, "Environment ID copied")}
        onCopyLink={() =>
          copy(`${window.location.origin}${basePath}`, "Link copied")
        }
        onDelete={() => setShowDeleteModal(true)}
      />
      {callout}
      <TabNav tabs={tabs} active={active} basePath={basePath} />

      {active === "overview" ? (
        <EnvironmentOverview
          environment={environment}
          serviceCount={services.length}
          chartCount={charts.length}
          basePath={basePath}
        />
      ) : active === "services" ? (
        <ServicesList environment={environment} editHref={`${basePath}/edit`} />
      ) : active === "helm" ? (
        <HelmChartsList environment={environment} />
      ) : (
        <EnvironmentConfiguration
          environment={environment}
          onEnvironmentUpdate={setEnvironment}
          editHref={`${basePath}/edit`}
          onDelete={() => setShowDeleteModal(true)}
          busy={Boolean(running)}
        />
      )}

      {showDeleteModal ? (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      ) : null}

      <AlertDialog open={confirmPush} onOpenChange={setConfirmPush}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {gitRepo?.branch
                ? `Push to ${repoName} (${gitRepo.branch})?`
                : `Push to ${repoName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {gitRepo?.branch
                ? "OpenPrime commits the generated code to this branch."
                : "OpenPrime commits the generated code to this repository."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => runJob("push")}>
              Push
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={leaveGuard.pending}
        onOpenChange={(open) => !open && leaveGuard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this page?</AlertDialogTitle>
            <AlertDialogDescription>
              {running === "download"
                ? "The ZIP download is still in progress. If you leave, the file will not be saved."
                : "The repository is still generating. If you leave, the ZIP download will not start."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on page</AlertDialogCancel>
            <AlertDialogAction onClick={leaveGuard.leave}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// One instance per environment: a job, its polling and its outcome end with
// the page of the environment they ran on (the route element is reused).
const EnvironmentDetailPage = ({ onDelete, onEnvironmentChange }) => {
  const { id } = useParams();
  return (
    <EnvironmentDetail
      key={id}
      id={id}
      onDelete={onDelete}
      onEnvironmentChange={onEnvironmentChange}
    />
  );
};

export default EnvironmentDetailPage;
