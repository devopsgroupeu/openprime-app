// src/components/EnvironmentsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Server } from "lucide-react";

import EnvironmentCard from "./EnvironmentCard";
import PrerequisitesChecklist from "./PrerequisitesChecklist";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import authService from "../services/authService";
import { useToast } from "../contexts/ToastContext";
import {
  SORTS,
  filterAndSortEnvironments,
  statusCounts,
  summarizeEnvironments,
} from "../utils/environmentStats";
import { ListToolbar } from "@/components/shared/list-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";
import { ResourceCardGrid } from "@/components/shared/resource-card";
import { StatCard } from "@/components/shared/settings";
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
import { statusLabel } from "@/components/ui/status-badge";

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

// Running and Stopped always; any other status only when it occurs.
const statusOptions = (environments) => {
  const counts = statusCounts(environments);
  const others = Object.keys(counts)
    .filter((s) => s !== "running" && s !== "stopped")
    .sort();
  return [
    { value: "all", label: "All", count: environments.length },
    ...["running", "stopped", ...others].map((s) => ({
      value: s,
      label: statusLabel(s),
      count: counts[s] ?? 0,
    })),
  ];
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
  onDelete,
}) => {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState(readSort);
  const [deleting, setDeleting] = useState(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const hasEnvironments = environments.length > 0;

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
        <ListPageSkeleton />
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

  const options = statusOptions(environments);
  // A status whose last environment went away falls back to All.
  const activeStatus = options.some((o) => o.value === status) ? status : "all";
  const visible = filterAndSortEnvironments(environments, {
    query,
    status: activeStatus,
    sort,
  });
  const searchOnly = query.trim() !== "" && activeStatus === "all";
  const stats = summarizeEnvironments(environments);

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
      toast.error(error.data?.error || error.message || "Try again.", {
        title: `Couldn't delete ${environment.name}`,
      });
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Environments"
        description="AWS environments that OpenPrime turns into Terraform, Helm and Argo CD code."
        actions={<NewEnvironmentButton />}
      />
      {loadError ? (
        <ErrorState thing="environments" onRetry={onRetry} />
      ) : !hasEnvironments ? (
        <>
          <EmptyState
            icon={Server}
            title="No environments yet"
            description="Create an environment to generate Terraform, Helm and Argo CD code for AWS."
            action={<NewEnvironmentButton size="sm" />}
          />
          <PrerequisitesChecklist hasCredentials={hasCredentials} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Environments" value={stats.total} />
            <StatCard label="Running" value={stats.running} />
            <StatCard label="Services enabled" value={stats.services} />
            <StatCard label="Regions" value={stats.regions} />
          </div>
          <ListToolbar
            search={query}
            onSearchChange={setQuery}
            searchLabel="Search by name, prefix or region"
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
