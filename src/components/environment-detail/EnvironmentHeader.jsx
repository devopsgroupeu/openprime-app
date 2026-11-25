import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Copy, Download, GitBranch, Link2, Pencil, Trash2 } from "lucide-react";
import ProviderIcon from "../icons/ProviderIcon";
import {
  getEffectiveStatus,
  modifiedAt,
  prefixOf,
  regionName,
  regionOf,
  statusDisplay,
} from "../../utils/environmentStats";
import { Callout } from "@/components/shared/callout";
import { CopyButton } from "@/components/shared/copy-button";
import { RelativeTime } from "@/components/shared/format";
import { IconTile } from "@/components/shared/icon-tile";
import { PageHeader } from "@/components/shared/page-header";
import { ResourceActionsMenu } from "@/components/shared/resource-actions-menu";
import { usePaletteActions } from "@/components/layout/CommandPalette";
import { guardedNavigate } from "@/components/shared/save-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NO_GIT = "Add a git repository in Edit > Basics to push.";

// Statuses whose next step is generating (the primary button).
const GENERATE_FIRST = new Set(["not-generated", "failed"]);

// Facts divided by hairlines. Each fact draws the hairline before it; the row
// is shifted left and clipped, so a fact that wraps to a new line starts clean.
const Facts = ({ children }) => (
  <span className="block overflow-x-clip">
    <span className="-ml-4 flex flex-wrap items-center gap-y-1">
      {children}
    </span>
  </span>
);
const Fact = ({ children }) => (
  <span className="relative ml-2 inline-flex items-center gap-1 pl-2 whitespace-nowrap before:absolute before:top-1/2 before:left-0 before:h-3 before:w-px before:-translate-y-1/2 before:bg-border">
    {children}
  </span>
);

/**
 * Name, status, region / prefix / modified, the two job actions, Edit and the
 * menu. `running` is the job in flight ("generate" | "push" | "download" |
 * null). The primary follows the stored status: Generate repository until the
 * environment is generated or after a failure, Edit otherwise. Below lg (a
 * tablet with the sidebar open, a phone) only the primary stays a button; the
 * other actions move into the menu so the title keeps its room.
 */
const EnvironmentHeader = ({
  environment,
  status,
  running,
  canPush,
  onGenerate,
  onPush,
  onCopyId,
  onCopyLink,
  onDelete,
}) => {
  const region = regionOf(environment);
  const prefix = prefixOf(environment);
  const modified = modifiedAt(environment);
  const busy = Boolean(running);
  const navigate = useNavigate();
  const editHref = `/environments/${environment.id}/edit`;
  const generateFirst = GENERATE_FIRST.has(
    statusDisplay(getEffectiveStatus(environment)).key,
  );

  // The same next steps from Cmd+K.
  usePaletteActions({
    heading: "This environment",
    actions: [
      { label: "Edit environment", icon: Pencil, to: editHref },
      {
        label: "Generate repository",
        icon: Download,
        onSelect: onGenerate,
        disabled: busy,
      },
      { label: "Copy environment ID", icon: Copy, onSelect: onCopyId },
    ],
  });

  const pushButton = (
    <Button variant="secondary" onClick={onPush} disabled={busy || !canPush}>
      {running === "push" ? <Spinner aria-hidden /> : <GitBranch aria-hidden />}
      {running === "push" ? "Pushing..." : "Push to git"}
    </Button>
  );

  const actions = [
    ...(generateFirst
      ? []
      : [
          {
            label: "Generate repository",
            icon: Download,
            onSelect: onGenerate,
            disabled: busy,
            className: "lg:hidden",
          },
        ]),
    {
      label: "Push to git",
      icon: GitBranch,
      onSelect: onPush,
      disabled: busy || !canPush,
      hint: canPush ? undefined : NO_GIT,
      className: "lg:hidden",
    },
    ...(generateFirst
      ? [
          {
            label: "Edit",
            icon: Pencil,
            // Through the leave guard, like a link: a generate may run.
            onSelect: () => guardedNavigate(() => navigate(editHref)),
            className: "lg:hidden",
          },
        ]
      : []),
    { label: "Copy environment ID", icon: Copy, onSelect: onCopyId },
    { label: "Copy link", icon: Link2, onSelect: onCopyLink },
    {
      label: "Delete environment",
      icon: Trash2,
      destructive: true,
      onSelect: onDelete,
      disabled: busy,
    },
  ];

  return (
    <PageHeader
      title={environment.name}
      tile={
        <IconTile size="xl" className="text-foreground">
          <ProviderIcon provider={environment.provider} />
        </IconTile>
      }
      status={<StatusBadge status={status} />}
      description={
        <Facts>
          {region ? (
            <Fact>
              <span className="font-mono text-xs">{region}</span>
              {regionName(environment)}
            </Fact>
          ) : null}
          {prefix ? (
            <Fact>
              Prefix <span className="font-mono text-xs">{prefix}</span>
              <CopyButton text={prefix} label="Copy prefix" size="icon-xs" />
            </Fact>
          ) : null}
          {modified ? (
            <Fact>
              Modified <RelativeTime iso={modified} />
            </Fact>
          ) : null}
        </Facts>
      }
      actions={
        <>
          <Button
            variant={generateFirst ? "default" : "secondary"}
            onClick={onGenerate}
            disabled={busy}
            className={generateFirst ? undefined : "max-lg:hidden"}
          >
            {running === "generate" ? (
              <Spinner aria-hidden />
            ) : (
              <Download aria-hidden />
            )}
            {running === "generate" ? "Generating..." : "Generate repository"}
          </Button>
          <span className="flex max-lg:hidden">
            {canPush ? (
              pushButton
            ) : (
              // A disabled button gets no pointer events: the wrapper
              // carries the tooltip (and keyboard focus).
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {pushButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{NO_GIT}</TooltipContent>
              </Tooltip>
            )}
          </span>
          <Button
            variant={generateFirst ? "secondary" : "default"}
            asChild
            className={generateFirst ? "max-lg:hidden" : undefined}
          >
            <Link to={editHref}>
              <Pencil aria-hidden />
              Edit
            </Link>
          </Button>
        </>
      }
      menu={
        <ResourceActionsMenu
          label={`More actions for ${environment.name}`}
          actions={actions}
        />
      }
    />
  );
};

const VERB = {
  generate: {
    running: "Generating repository. This can take a few minutes.",
    failed: "Couldn't generate the repository.",
    retry: "Try again",
  },
  push: {
    running: "Pushing to git. This can take a few minutes.",
    failed: "Couldn't push to git.",
    retry: "Try again",
  },
  download: {
    running: "Downloading the repository.",
    failed: "Couldn't download the repository.",
    retry: "Download again",
  },
};

// The backend wraps job errors in its own "Failed to ...:" prefix; the
// callout title already says what failed.
const BACKEND_PREFIX = /^Failed to (generate infrastructure|push to Git):\s*/i;

const pad = (n) => String(n).padStart(2, "0");

// m:ss since `since`, ticking every second.
function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return (
    <span className="block pt-1.25 text-xs text-muted-foreground tabular-nums">
      {Math.floor(seconds / 60)}:{pad(seconds % 60)}
    </span>
  );
}

/**
 * Under the header: the job in flight with its elapsed time, or the last
 * failure (`error`: message, optional request ID) with Try again (Download
 * again for a failed ZIP download; no `onRetry`: no button, a `note` says
 * why). `announce` only for a failure of this visit, not one stored before the
 * page opened.
 */
export function JobCallout({
  kind,
  startedAt,
  error,
  onRetry,
  note,
  announce,
}) {
  if (!error) {
    return (
      <Callout
        variant="info"
        icon={Spinner}
        action={<Elapsed since={startedAt} />}
      >
        {VERB[kind].running}
      </Callout>
    );
  }
  return (
    <Callout
      variant="error"
      announce={announce}
      title={VERB[kind].failed}
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {VERB[kind].retry}
          </Button>
        ) : null
      }
    >
      {error.message ? (
        <span className="wrap-break-word">
          {error.message.replace(BACKEND_PREFIX, "")}
        </span>
      ) : null}
      {note ? <span className="mt-1 block">{note}</span> : null}
      {error.requestId ? (
        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          Error ID <span className="font-mono">{error.requestId}</span>
          <CopyButton
            text={error.requestId}
            label="Copy error ID"
            size="icon-xs"
          />
        </span>
      ) : null}
    </Callout>
  );
}

export default EnvironmentHeader;
