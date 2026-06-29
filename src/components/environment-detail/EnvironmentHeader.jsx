import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MapPin,
  Package,
  GitBranch,
} from "lucide-react";
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
  const navigate = useNavigate();
  const branded = isBrandedProvider(environment.provider);

  return (
    <div className="border-b border-border">
      <div className="px-8 py-6">
        <button
          onClick={() => navigate("/environments")}
          className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider text-tertiary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Environments
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-primary">
              {environment.name}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-secondary">
                <ProviderIcon
                  provider={environment.provider}
                  className={`w-4 h-4 ${branded ? "text-[#FF9900]" : "text-accent"}`}
                />
                {providerConfig?.name || environment.provider}
              </span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-tertiary" />
                <span className="text-sm text-secondary">
                  {environment.region}
                </span>
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
