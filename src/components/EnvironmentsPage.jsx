// src/components/EnvironmentsPage.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Layers, Plus } from "lucide-react";

import EnvironmentCard from "./EnvironmentCard";
import EnvironmentStatStrip from "./EnvironmentStatStrip";
import PrerequisitesChecklist from "./PrerequisitesChecklist";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import authService from "../services/authService";
import { useToast } from "../contexts/ToastContext";
import {
  SORTS,
  filterAndSortEnvironments,
  statusFilters,
} from "../utils/environmentStats";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";
import { ResourceCardGrid } from "@/components/shared/resource-card";
import { ListPageSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { describeError } from "@/lib/describe-error";

const SORT_KEY = "openprime-environments-sort";
const SORT_LABELS = {
  modified: "Recently modified",
  name: "Name A to Z",
  services: "Most services",
};

// The sort survives reloads (per browser); storage may be blocked.
const readSort = () => {
  try {
    const saved = localStorage.getItem(SORT_KEY);
    return SORTS.includes(saved) ? saved : "modified";
  } catch {
    return "modified";
  }
};

const NewEnvironmentButton = ({ size }) => (
  <Button size={size} asChild>
    <Link to="/environments/create">
      <Plus aria-hidden />
      New environment
    </Link>
  </Button>
);

const EnvironmentsPage = ({
  environments,
  loading = false,
  loadError,
  onRetry,
  onRefresh,
  onDelete,
}) => {
  const toast = useToast();
  const [query, setQuery] = useState("");
  // The status filter is shareable and survives Back: it lives in ?status=.
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const [sort, setSort] = useState(readSort);
  const [deleting, setDeleting] = useState(null);
  // null until the check answers, so the first-run tips do not flash.
  const [hasCredentials, setHasCredentials] = useState(null);
  const hasEnvironments = environments.length > 0;

  const setStatus = (value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all") next.delete("status");
        else next.set("status", value);
        return next;
      },
      { replace: true },
    );

  // A status no environment has (an old link, the last one deleted) is All,
  // in the URL too.
  const staleStatus =
    !loading &&
    !loadError &&
    status !== "all" &&
    !statusFilters(environments).some((o) => o.value === status);
  useEffect(() => {
    if (staleStatus) setStatus("all");
  }, [staleStatus]);

  // Opening the list reads the server again (jobs end after their page
  // closed), except during the first load, which already does.
  useEffect(() => {
    if (!loading) onRefresh?.();
  }, []);

  useEffect(() => {
    if (!loading && !hasEnvironments && !loadError) {
      authService
        .get("/cloud-credentials")
        .then((res) => {
          setHasCredentials((res.credentials || []).length > 0);
        })
        .catch(() => setHasCredentials(false));
    }
  }, [loading, hasEnvironments, loadError]);

  if (loading) {
    return (
      <PageShell>
        <ListPageSkeleton stats={4} />
      </PageShell>
    );
  }

  const changeSort = (value) => {
    setSort(value);
    try {
      localStorage.setItem(SORT_KEY, value);
    } catch {
      // Not persisted; the choice still applies until reload.
    }
  };

  const options = [
    { value: "all", label: "All", count: environments.length },
    ...statusFilters(environments),
  ];
  const activeStatus = options.some((o) => o.value === status) ? status : "all";
  const visible = filterAndSortEnvironments(environments, {
    query,
    status: activeStatus,
    sort,
  });
  const searchOnly = query.trim() !== "" && activeStatus === "all";

  const copyId = async (environment) => {
    try {
      await navigator.clipboard.writeText(environment.id);
      toast.success("Environment ID copied");
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };

  // The dialog closes after this returns, also after a failure (toasted here).
  const confirmDelete = async () => {
    const environment = deleting;
    try {
      await onDelete(environment.id);
      toast.success(`Deleted ${environment.name}.`);
    } catch (error) {
      toast.error(describeError(error, `delete ${environment.name}`));
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Environments"
        description="AWS environments that OpenPrime turns into Terraform, Helm and Argo CD code."
        // First run: the empty state carries the one way forward.
        actions={hasEnvironments || loadError ? <NewEnvironmentButton /> : null}
      />
      {loadError ? (
        <ErrorState
          thing="environments"
          message={loadError.message}
          requestId={loadError.requestId}
          onRetry={onRetry}
        />
      ) : !hasEnvironments ? (
        <>
          <EmptyState
            icon={Layers}
            title="No environments yet"
            description="Create an environment to generate Terraform, Helm and Argo CD code for AWS."
            action={<NewEnvironmentButton size="sm" />}
          />
          {hasCredentials !== null ? (
            <PrerequisitesChecklist hasCredentials={hasCredentials} />
          ) : null}
        </>
      ) : (
        <>
          <EnvironmentStatStrip environments={environments} />
          <ListToolbar
            search={query}
            onSearchChange={setQuery}
            searchLabel="Search environments"
            origins={options}
            origin={activeStatus}
            onOriginChange={setStatus}
            resultCount={visible.length}
            resultNoun={["environment", "environments"]}
            sort={
              <Select value={sort} onValueChange={changeSort}>
                <SelectTrigger
                  aria-label="Sort environments"
                  className="w-auto"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  {SORTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SORT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          {visible.length === 0 ? (
            searchOnly ? (
              <EmptyState
                variant="filtered"
                title="No environments found"
                description={`No environments match "${query.trim()}".`}
                clearLabel="Clear search"
                onClearFilters={() => setQuery("")}
              />
            ) : (
              <EmptyState
                variant="filtered"
                title="No environments found"
                onClearFilters={() => {
                  setQuery("");
                  setStatus("all");
                }}
              />
            )
          ) : (
            <ResourceCardGrid>
              {visible.map((environment) => (
                <EnvironmentCard
                  key={environment.id}
                  environment={environment}
                  onCopyId={copyId}
                  onDelete={onDelete ? setDeleting : undefined}
                />
              ))}
            </ResourceCardGrid>
          )}
        </>
      )}
      {deleting ? (
        <ConfirmDeleteModal
          environment={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </PageShell>
  );
};

export default EnvironmentsPage;
