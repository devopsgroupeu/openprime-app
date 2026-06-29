// src/components/EnvironmentsPage.jsx
import { useNavigate } from "react-router";
import { Plus, Server } from "lucide-react";
import EnvironmentCard from "./EnvironmentCard";

const EnvironmentsPage = ({ environments }) => {
  const navigate = useNavigate();
  const hasEnvironments = environments.length > 0;

  return (
    <div className="transition-colors duration-200 bg-transparent">
      <div className="px-4 sm:px-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-primary">
              Environments
            </h1>
            <p className="text-secondary mt-1">
              Manage and deploy your cloud infrastructure environments.
            </p>
          </div>
          <button
            onClick={() => navigate("/environments/create")}
            className="btn-op-primary animate-fade-in self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Environment
          </button>
        </div>

        {hasEnvironments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {environments.map((env) => (
              <EnvironmentCard
                key={env.id}
                environment={env}
                onClick={(environment) =>
                  navigate(`/environments/${environment.id}`)
                }
                onEdit={(environment) =>
                  navigate(`/environments/${environment.id}/edit`)
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary-muted flex items-center justify-center">
              <Server className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-lg font-extrabold text-primary mt-4">
              No environments yet
            </h3>
            <p className="text-secondary mt-1">
              Create your first environment to get started.
            </p>
            <button
              onClick={() => navigate("/environments/create")}
              className="btn-op-primary mt-6"
            >
              <Plus className="w-4 h-4" />
              New Environment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentsPage;
