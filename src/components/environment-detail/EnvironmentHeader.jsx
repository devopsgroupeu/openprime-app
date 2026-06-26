import { Edit2, Trash2, MapPin, Key, Package, GitBranch } from "lucide-react";
import ProviderIcon, { isBrandedProvider } from "../icons/ProviderIcon";

const EnvironmentHeader = ({
  environment,
  providerConfig,
  onEdit,
  onDelete,
  onGenerate,
  onPush,
  isGenerating,
  isPushing,
  canPush,
}) => {
  const branded = isBrandedProvider(environment.provider);

  const getStatusColor = (status) => {
    const colors = {
      running: "bg-success-muted text-success",
      pending: "bg-warning-muted text-warning",
      stopped: "text-tertiary bg-background",
      error: "bg-danger-muted text-danger",
    };
    return colors[status] || colors["pending"];
  };

  return (
    <div className="border-b border-border">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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
            <div>
              <h1 className="text-3xl font-extrabold text-primary">
                {environment.name}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-secondary">
                  {providerConfig?.name || environment.provider}
                </span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-tertiary" />
                  <span className="text-sm text-secondary">
                    {environment.region}
                  </span>
                </div>
                {environment.cloudCredential && (
                  <div className="flex items-center space-x-1">
                    <Key className="w-4 h-4 text-tertiary" />
                    <span className="text-sm text-secondary">
                      {environment.cloudCredential.name} (
                      {environment.cloudCredential.identifier})
                    </span>
                  </div>
                )}
                <div
                  className={`status-badge ${getStatusColor(
                    environment.status,
                  )}`}
                >
                  {(environment.status === "running" ||
                    environment.status === "pending") && (
                    <span
                      className={`status-dot animate-pulse ${
                        environment.status === "running"
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    />
                  )}
                  {environment.status.charAt(0).toUpperCase() +
                    environment.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="btn-op-secondary space-x-2"
            >
              <Package
                className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              <span>
                {isGenerating ? "Generating..." : "Generate Repository"}
              </span>
            </button>

            <button
              onClick={onPush}
              disabled={isPushing || !canPush}
              className="btn-op-secondary space-x-2"
            >
              <GitBranch
                className={`w-4 h-4 ${isPushing ? "animate-spin" : ""}`}
              />
              <span>{isPushing ? "Pushing..." : "Push to Git"}</span>
            </button>

            <button
              onClick={() => onEdit(environment)}
              className="btn-op-primary space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button onClick={onDelete} className="btn-op-danger space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentHeader;
