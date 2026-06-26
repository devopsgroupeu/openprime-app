// src/components/SettingsPage.js
import { useState, useEffect } from "react";
import { Cloud, User, Save, Plus, Edit2, Trash2, Settings } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import CloudCredentialModal from "./modals/CloudCredentialModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

const SettingsPage = () => {
  const toast = useToast();
  const [userPreferences, setUserPreferences] = useState({
    theme: "light",
    notifications: true,
    defaultProvider: "aws",
    defaultRegion: "us-east-1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [gitIntegration, setGitIntegration] = useState({
    platform: "github",
    orgUrl: "",
  });
  const [cloudCredentials, setCloudCredentials] = useState([]);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState("aws");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    loadUserData();
    loadCloudCredentials();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userResponse, preferencesResponse] = await Promise.all([
        authService.get("/users/me"),
        authService.get("/users/me/preferences"),
      ]);

      setProfile({
        firstName: userResponse.firstName || "",
        lastName: userResponse.lastName || "",
        email: userResponse.email || "",
      });

      setUserPreferences(preferencesResponse.preferences);
      if (preferencesResponse.preferences?.gitIntegration) {
        setGitIntegration(preferencesResponse.preferences.gitIntegration);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleProfileChange = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadCloudCredentials = async () => {
    try {
      const response = await authService.get("/cloud-credentials");
      setCloudCredentials(response.credentials || []);
    } catch (error) {
      console.error("Failed to load cloud credentials:", error);
    }
  };
  const saveSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        authService.put("/users/me/profile", profile),
        authService.put("/users/me/preferences", {
          ...userPreferences,
          gitIntegration,
        }),
      ]);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCredential = (provider) => {
    setSelectedProvider(provider);
    setSelectedCredential(null);
    setShowCredentialModal(true);
  };

  const handleEditCredential = async (credential) => {
    try {
      const response = await authService.get(
        `/cloud-credentials/${credential.id}`,
      );
      setSelectedCredential(response.credential);
      setSelectedProvider(credential.provider);
      setShowCredentialModal(true);
    } catch (error) {
      console.error("Failed to load credential details:", error);
    }
  };

  const handleDeleteCredential = (credential) => {
    setCredentialToDelete(credential);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await authService.delete(`/cloud-credentials/${credentialToDelete.id}`);
      await loadCloudCredentials();
      setShowDeleteModal(false);
      toast.success("Credential deleted successfully");
      setCredentialToDelete(null);
    } catch (error) {
      console.error("Failed to delete credential:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to delete credential";
      toast.error(errorMessage, { title: "Delete Error" });
    }
  };

  const handleSaveCredential = async (credentialData) => {
    try {
      if (selectedCredential) {
        await authService.put(
          `/cloud-credentials/${selectedCredential.id}`,
          credentialData,
        );
        toast.success("Credential updated successfully");
      } else {
        await authService.post("/cloud-credentials", credentialData);
        toast.success("Credential created successfully");
      }
      await loadCloudCredentials();
      setShowCredentialModal(false);
      setSelectedCredential(null);
    } catch (error) {
      console.error("Failed to save credential:", error);
      // Extract error message from response
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to save credential";
      toast.error(errorMessage, { title: "Credential Error", duration: 7000 });
    }
  };
  if (loading) {
    return (
      <div className="transition-colors bg-transparent">
        <div className="px-8 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-poppins text-primary">
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "credentials", label: "Cloud Credentials", icon: Cloud },
  ];

  const saveButton = (
    <button
      onClick={saveSettings}
      disabled={saving}
      className="btn-op-primary transition-all"
    >
      {saving ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </>
      )}
    </button>
  );

  return (
    <div className="transition-colors bg-transparent">
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-primary">Settings</h1>
          <p className="text-secondary mt-1">
            Manage your account and platform preferences.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left tab nav */}
          <nav className="md:w-56 shrink-0 flex md:flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border-l-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-transparent text-secondary hover:text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right content panel */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-border bg-surface p-6">
              {activeTab === "account" && (
                <div className="space-y-4">
                  <p className="section-label">User Profile</p>
                  <div>
                    <label className="block text-sm font-medium font-poppins mb-2 transition-colors text-secondary">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        handleProfileChange("firstName", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 transition-colors text-secondary">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        handleProfileChange("lastName", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 transition-colors text-secondary">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="pt-4 flex justify-end border-t border-border">
                    {saveButton}
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-4">
                  <p className="section-label">Preferences</p>
                  <div>
                    <label className="block text-sm font-medium mb-2 transition-colors text-secondary">
                      Default Cloud Provider
                    </label>
                    <select
                      value={userPreferences.defaultProvider}
                      onChange={(e) =>
                        handlePreferenceChange(
                          "defaultProvider",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary"
                    >
                      <option value="aws">AWS</option>
                      <option value="azure">Azure</option>
                      <option value="gcp">Google Cloud</option>
                      <option value="on-premise">On-Premise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 transition-colors text-secondary">
                      Default Region
                    </label>
                    <input
                      type="text"
                      value={userPreferences.defaultRegion}
                      onChange={(e) =>
                        handlePreferenceChange("defaultRegion", e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors bg-background-secondary border-border text-primary"
                      placeholder="us-east-1"
                    />
                  </div>
                  <div className="pt-4 flex justify-end border-t border-border">
                    {saveButton}
                  </div>
                </div>
              )}

              {activeTab === "credentials" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="section-label">AWS Credentials</p>
                    <button
                      onClick={() => handleAddCredential("aws")}
                      className="btn-op-primary transition-all"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {cloudCredentials.filter((c) => c.provider === "aws")
                      .length === 0 ? (
                      <div className="text-center py-8 transition-colors text-secondary">
                        <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No AWS credentials configured</p>
                        <p className="text-sm mt-1">
                          Add your first credential to get started
                        </p>
                      </div>
                    ) : (
                      cloudCredentials
                        .filter((c) => c.provider === "aws")
                        .map((credential) => (
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
                                onClick={() => handleEditCredential(credential)}
                                className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCredential(credential)
                                }
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
              )}
            </div>
          </div>
        </div>
      </div>

      {showCredentialModal && (
        <CloudCredentialModal
          credential={selectedCredential}
          provider={selectedProvider}
          onClose={() => {
            setShowCredentialModal(false);
            setSelectedCredential(null);
          }}
          onSave={handleSaveCredential}
          isOpen={showCredentialModal}
        />
      )}

      {showDeleteModal && credentialToDelete && (
        <ConfirmDeleteModal
          onClose={() => {
            setShowDeleteModal(false);
            setCredentialToDelete(null);
          }}
          onConfirm={confirmDelete}
          isOpen={showDeleteModal}
          title="Delete Credential"
          message={`Are you sure you want to delete the credential "${credentialToDelete.name}"?`}
        />
      )}
    </div>
  );
};

export default SettingsPage;
