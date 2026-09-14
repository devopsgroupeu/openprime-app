import { useNavigate } from "react-router";
import {
  CheckCircle,
  Circle,
  Cloud,
  GitBranch,
  HardDrive,
  Plus,
} from "lucide-react";

const PrerequisitesChecklist = ({ hasCredentials = false }) => {
  const navigate = useNavigate();

  const items = [
    {
      id: "credentials",
      icon: Cloud,
      title: "Cloud credentials added",
      description: "Add AWS credentials in Settings",
      done: hasCredentials,
      action: {
        label: "Go to Settings",
        onClick: () => navigate("/settings"),
      },
    },
    {
      id: "git",
      icon: GitBranch,
      title: "Git repository configured",
      description:
        "Have a Git repository URL ready for your infrastructure code",
      done: false,
    },
    {
      id: "terraform",
      icon: HardDrive,
      title: "Terraform backend ready",
      description: "Have an S3 bucket name ready for Terraform state",
      done: false,
    },
  ];

  const completedCount = items.filter((item) => item.done).length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-primary">
            Before you create your first environment
          </h3>
          <p className="text-sm text-secondary mt-1">
            {completedCount} of {items.length} prerequisites ready
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const Icon = item.icon;
          const StatusIcon = item.done ? CheckCircle : Circle;

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                item.done
                  ? "bg-success-muted/30 border-success/30"
                  : "bg-background border-border"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.done ? "bg-success-muted" : "bg-primary-muted"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    item.done ? "text-success" : "text-accent"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary text-sm">
                    {item.title}
                  </span>
                  <StatusIcon
                    className={`w-4 h-4 ${
                      item.done ? "text-success" : "text-tertiary"
                    }`}
                  />
                </div>
                <p className="text-sm text-secondary mt-0.5">
                  {item.description}
                </p>
                {item.action && !item.done && (
                  <button
                    onClick={item.action.onClick}
                    className="text-xs font-semibold text-accent hover:text-primary-hover mt-1.5 transition-colors"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/environments/create")}
        className="btn-op-primary w-full"
      >
        <Plus className="w-4 h-4" />
        New Environment
      </button>
    </div>
  );
};

export default PrerequisitesChecklist;
