import { Cloud, Edit2, Trash2 } from "lucide-react";
import { getProviderRegions } from "../../config/providersConfig";

const AccountTab = ({ profile, onProfileChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="settings-first-name"
          className="block text-sm font-semibold text-label mb-2"
        >
          First Name
        </label>
        <input
          id="settings-first-name"
          type="text"
          value={profile.firstName}
          onChange={(e) => onProfileChange("firstName", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your first name"
        />
      </div>
      <div>
        <label
          htmlFor="settings-last-name"
          className="block text-sm font-semibold text-label mb-2"
        >
          Last Name
        </label>
        <input
          id="settings-last-name"
          type="text"
          value={profile.lastName}
          onChange={(e) => onProfileChange("lastName", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your last name"
        />
      </div>
      <div>
        <label
          htmlFor="settings-email"
          className="block text-sm font-semibold text-label mb-2"
        >
          Email
        </label>
        <input
          id="settings-email"
          type="email"
          value={profile.email}
          onChange={(e) => onProfileChange("email", e.target.value)}
          className="w-full px-4 py-2.5 transition-colors"
          placeholder="Enter your email"
        />
      </div>
    </div>
  );
};

const PreferencesTab = ({ userPreferences, onPreferenceChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="settings-default-provider"
          className="block text-sm font-semibold text-label mb-2"
        >
          Default Cloud Provider
        </label>
        <select
          id="settings-default-provider"
          value={userPreferences.defaultProvider}
          onChange={(e) =>
            onPreferenceChange("defaultProvider", e.target.value)
          }
          className="w-full px-4 py-2.5 transition-colors"
        >
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">Google Cloud</option>
          <option value="on-premise">On-Premise</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="settings-default-region"
          className="block text-sm font-semibold text-label mb-2"
        >
          Default Region
        </label>
        <select
          id="settings-default-region"
          value={userPreferences.defaultRegion}
          onChange={(e) =>
            onPreferenceChange("defaultRegion", e.target.value)
          }
          className="w-full px-4 py-2.5 transition-colors"
        >
          {getProviderRegions(userPreferences.defaultProvider).map(
            (region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
};

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
          <Cloud className="w-4 h-4 mr-1" />
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

const SettingsContentPanel = ({
  activeTab,
  profile,
  onProfileChange,
  userPreferences,
  onPreferenceChange,
  cloudCredentials,
  onAddCredential,
  onEditCredential,
  onDeleteCredential,
}) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="rounded-2xl border border-border bg-surface p-6">
        {activeTab === "account" && (
          <AccountTab
            profile={profile}
            onProfileChange={onProfileChange}
          />
        )}
        {activeTab === "preferences" && (
          <PreferencesTab
            userPreferences={userPreferences}
            onPreferenceChange={onPreferenceChange}
          />
        )}
        {activeTab === "credentials" && (
          <CloudCredentialsTab
            credentials={cloudCredentials}
            onAddCredential={onAddCredential}
            onEditCredential={onEditCredential}
            onDeleteCredential={onDeleteCredential}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsContentPanel;
