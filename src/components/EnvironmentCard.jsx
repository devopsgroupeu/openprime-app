// src/components/EnvironmentCard.jsx
import { Clock, ArrowRight } from "lucide-react";
import ProviderIcon, { isBrandedProvider } from "./icons/ProviderIcon";

const relTime = (iso) => {
  if (!iso) return "recently";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const STATUS_STYLES = {
  running: {
    badge: "bg-success-muted text-success",
    dot: "bg-success animate-pulse",
  },
  active: {
    badge: "bg-success-muted text-success",
    dot: "bg-success animate-pulse",
  },
  pending: {
    badge: "bg-warning-muted text-warning",
    dot: "bg-warning animate-pulse",
  },
  provisioning: {
    badge: "bg-warning-muted text-warning",
    dot: "bg-warning animate-pulse",
  },
};
const STATUS_FALLBACK = {
  badge: "bg-background text-tertiary",
  dot: "bg-border-strong",
};

const EnvironmentCard = ({ environment, onClick }) => {
  const status = environment.status || "stopped";
  const { badge, dot } = STATUS_STYLES[status] || STATUS_FALLBACK;
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const branded = isBrandedProvider(environment.provider);

  const enabledCount = Object.values(environment.services || {}).filter(
    (s) => s?.enabled,
  ).length;

  const modified = relTime(
    environment.updated_at || environment.updatedAt || environment.created_at,
  );

  return (
    <div
      className="group rounded-2xl border border-border bg-surface p-6 transition-all cursor-pointer hover:border-primary/40 hover:shadow-lg"
      onClick={() => onClick?.(environment)}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-3 items-center">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              branded
                ? "bg-background border border-border"
                : "bg-primary-muted"
            }`}
          >
            <ProviderIcon
              provider={environment.provider}
              className={`w-5 h-5 ${branded ? "text-[#FF9900]" : "text-accent"}`}
            />
          </div>
          <h3 className="text-lg font-extrabold text-primary transition-colors group-hover:accent-teal">
            {environment.name}
          </h3>
        </div>
        <span className={`status-badge ${badge}`}>
          <span className={`status-dot ${dot}`} />
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="section-label mb-1">Services</p>
          <p className="text-xl font-bold text-primary">{enabledCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="section-label mb-1">Region</p>
          <p className="text-sm font-bold text-primary">
            {environment.region || environment.location || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-tertiary">
          <Clock className="w-3.5 h-3.5" />
          <span>Modified {modified}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-secondary transition-colors group-hover:text-primary">
          View <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default EnvironmentCard;
