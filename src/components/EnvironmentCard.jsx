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

const EnvironmentCard = ({ environment, onClick, onEdit }) => {
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
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            branded ? "bg-background border border-border" : "bg-primary-muted"
          }`}
        >
          <ProviderIcon
            provider={environment.provider}
            className={`w-5 h-5 ${branded ? "text-[#FF9900]" : "text-accent"}`}
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-primary transition-colors group-hover:accent-teal truncate">
            {environment.name}
          </h3>
          {(environment.globalPrefix || environment.global_prefix) && (
            <p className="text-xs font-mono text-tertiary">
              {environment.globalPrefix || environment.global_prefix}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-surface-elevated p-3">
          <p className="section-label mb-1">Services</p>
          <p className="text-xl font-bold text-primary">{enabledCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-3">
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
        <div className="flex items-center gap-2 text-xs font-bold text-secondary">
          <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span className="text-border-strong">·</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(environment);
            }}
            className="transition-colors hover:text-primary"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentCard;
