// src/components/SettingsPage.jsx
import { useState, useEffect } from "react";
import { Cloud, User, Save, Settings } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import CloudCredentialModal from "./modals/CloudCredentialModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import AccountTab from "./settings-page/AccountTab";
import CloudCredentialsTab from "./settings-page/CloudCredentialsTab";
import PreferencesTab from "./settings-page/PreferencesTab";
import SettingsTabNav from "./settings-page/SettingsTabNav";

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
              <p className="text-lg text-primary">Loading settings...</p>
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

  return (
    <div className="transition-colors bg-transparent">
      <div className="px-8 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-primary">Settings</h1>
            <p className="text-secondary mt-1">
              Manage your account and platform preferences.
            </p>
          </div>
          {activeTab !== "credentials" && (
            <button
              onClick={saveSettings}
              disabled={saving}
              className="btn-op-primary transition-all self-start sm:self-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <SettingsTabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-border bg-surface p-6">
              {activeTab === "account" && (
                <AccountTab
                  profile={profile}
                  onProfileChange={handleProfileChange}
                />
              )}
              {activeTab === "preferences" && (
                <PreferencesTab
                  userPreferences={userPreferences}
                  onPreferenceChange={handlePreferenceChange}
                />
              )}
              {activeTab === "credentials" && (
                <CloudCredentialsTab
                  credentials={cloudCredentials}
                  onAddCredential={handleAddCredential}
                  onEditCredential={handleEditCredential}
                  onDeleteCredential={handleDeleteCredential}
                />
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
