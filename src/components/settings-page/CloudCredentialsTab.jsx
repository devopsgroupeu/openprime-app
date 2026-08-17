import { Cloud, Edit2, Plus, Trash2 } from "lucide-react";

const CloudCredentialsTab = ({
  credentials,
  onAddCredential,
  onEditCredential,
  onDeleteCredential,
}) => {
  const awsCredentials = credentials.filter((c) => c.provider === "aws");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="section-label">AWS Credentials</p>
        <button
          onClick={() => onAddCredential("aws")}
          className="btn-op-primary transition-all"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </button>
      </div>
      <div className="space-y-3">
        {awsCredentials.length === 0 ? (
          <div className="text-center py-8 transition-colors text-secondary">
            <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No AWS credentials configured</p>
            <p className="text-sm mt-1">
              Add your first credential to get started
            </p>
          </div>
        ) : (
          awsCredentials.map((credential) => (
            <div
              key={credential.id}
              className="flex items-center justify-between p-4 rounded-lg transition-colors bg-background border border-border"
            >
              <div className="flex items-center flex-1 gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold transition-colors text-primary">
                    {credential.name}
                    {credential.isDefault && (
                      <span className="ml-2 px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm transition-colors text-secondary">
                    Account: {credential.identifier}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEditCredential(credential)}
                  className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteCredential(credential)}
                  className="p-2 rounded-lg transition-colors text-tertiary hover:text-danger hover:bg-danger-muted"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CloudCredentialsTab;
