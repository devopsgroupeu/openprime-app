import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import EnvironmentHeader, {
  JobCallout,
} from "./environment-detail/EnvironmentHeader";
import EnvironmentOverview from "./environment-detail/EnvironmentOverview";
import ServicesList, {
  enabledServiceEntries,
} from "./environment-detail/ServicesList";
import HelmChartsList, {
  enabledCharts,
} from "./environment-detail/HelmChartsList";
import EnvironmentConfiguration from "./environment-detail/EnvironmentConfiguration";
import { gitRepositoryOf } from "./environment-detail/ExternalResources";
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

// Toast text when an error carries no message.
const FAILED = {
  generate: "Couldn't generate the repository. Try again.",
  push: "Couldn't push to git. Try again.",
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

function EnvironmentDetail({ id, onDelete }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const [environment, setEnvironment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [reload, setReload] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // The job this page runs: { kind, startedAt } while it polls, then
  // { kind, error } when it ends without an outcome stored on the environment.
  const [job, setJob] = useState(null);
  // A job failed on this visit: its callout is announced, a failure stored
  // before the page opened is not.
  const [failedHere, setFailedHere] = useState(false);
  const mountedRef = useRef(true);
  const running = job && !job.error ? job.kind : null;
  // Leaving drops the download: polling is tied to this page being mounted.
  const leaveGuard = useUnsavedGuard(running === "generate");

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
            message: err.message,
            requestId: err.requestId,
          });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEnvironment();
  }, [id, reload]);

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
  const gitEnabled = Boolean(gitRepositoryOf(environment)?.enabled);

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

  const runJob = async (kind) => {
    const jobEnvironmentId = environment.id;
    // Mirrors the backend (jobService.persistOutcome + the lifecycle status),
    // so the badge and the failure callout follow the job without a refetch.
    // Only onto the environment the job ran on.
    const recordOutcome = (status, error = null) =>
      setEnvironment((env) =>
        env?.id === jobEnvironmentId
          ? {
              ...env,
              status: status === "succeeded" ? "running" : "failed",
              [`last_${kind}_at`]: new Date().toISOString(),
              [`last_${kind}_status`]: status,
              [`last_${kind}_error`]: error,
            }
          : env,
      );
    setJob({ kind, startedAt: Date.now() });
    try {
      const { jobId } = await authService.post(
        `/environments/${environment.id}/${kind}`,
        {},
        { headers: { "X-Async-Jobs": "true" } },
      );
      const result = await pollJob(jobId, mountedRef);
      if (result === null) return;
      recordOutcome("succeeded");
      if (kind === "generate") {
        if (!result.result?.downloadUrl) {
          throw new Error("Generated artifact is not available");
        }
        const blob = await authService.getBlob(result.result.downloadUrl);
        if (!mountedRef.current) return;
        triggerDownload(blob, `${environment.name}-infrastructure.zip`);
        toast.success("Repository generated and downloaded.");
      } else {
        toast.success(result.result?.message || "Pushed to git.");
      }
      setJob(null);
    } catch (err) {
      console.error(`Error running the ${kind} job:`, err);
      if (!mountedRef.current) return;
      const message = err.data?.error || err.message;
      const errorId = err.requestId ? ` (Error ID: ${err.requestId})` : "";
      toast.error(`${message || FAILED[kind]}${errorId}`);
      setFailedHere(true);
      if (err.jobFailed) {
        // The callout reads the stored outcome, as after a reload.
        recordOutcome("failed", message);
        setJob(null);
      } else {
        setJob({ kind, error: { message, requestId: err.requestId } });
      }
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
  const callout = running ? (
    <JobCallout kind={running} startedAt={job.startedAt} />
  ) : failure ? (
    <JobCallout
      kind={job?.kind ?? last.kind}
      error={failure}
      onRetry={() => runJob(job?.kind ?? last.kind)}
      announce={failedHere}
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
      toast.error(err.data?.error || err.message || "Try again.", {
        title: `Couldn't delete ${environment.name}`,
      });
    }
  };

  return (
    <PageShell width="detail">
      <EnvironmentHeader
        environment={environment}
        status={running ? "deploying" : getEffectiveStatus(environment)}
        running={running}
        canPush={gitEnabled}
        onGenerate={() => runJob("generate")}
        onPush={() => runJob("push")}
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
        />
      )}

      {showDeleteModal ? (
        <ConfirmDeleteModal
          environment={environment}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      ) : null}

      <AlertDialog
        open={leaveGuard.pending}
        onOpenChange={(open) => !open && leaveGuard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this page?</AlertDialogTitle>
            <AlertDialogDescription>
              The repository is still generating. If you leave, the ZIP download
              will not start.
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
const EnvironmentDetailPage = ({ onDelete }) => {
  const { id } = useParams();
  return <EnvironmentDetail key={id} id={id} onDelete={onDelete} />;
};

export default EnvironmentDetailPage;
