// src/components/SettingsPage.jsx
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { KeyRound, SlidersHorizontal, User } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import CloudCredentialModal from "./modals/CloudCredentialModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import AccountTab from "./settings-page/AccountTab";
import CloudCredentialsTab from "./settings-page/CloudCredentialsTab";
import PreferencesTab from "./settings-page/PreferencesTab";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";
import { SaveBar } from "@/components/shared/save-bar";
import { SettingsPageSkeleton } from "@/components/shared/skeletons";
import { ErrorState } from "@/components/shared/states";
import { Separator } from "@/components/ui/separator";

export const SETTINGS_TABS = [
  {
    id: "account",
    label: "Account",
    icon: User,
    description: "Your name and email as shown in OpenPrime.",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: SlidersHorizontal,
    description: "Your default cloud provider and region.",
  },
  {
    id: "cloud-credentials",
    label: "Cloud credentials",
    icon: KeyRound,
    description:
      "Access keys OpenPrime uses to create the Terraform state bucket in your AWS account.",
  },
];

// True when any top-level value differs (drafts are edited one key at a time).
const changed = (a, b) =>
  Object.keys({ ...a, ...b }).some((key) => a[key] !== b[key]);

const SettingsPage = () => {
  const toast = useToast();
  const { tab: activeTab } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userPreferences, setUserPreferences] = useState({
    theme: "light",
    notifications: true,
    defaultProvider: "aws",
    defaultRegion: "us-east-1",
  });
  // "loading" | "error" | "ready", for the user data and the credentials.
  const [userStatus, setUserStatus] = useState("loading");
  const [credentialsStatus, setCredentialsStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  // The last loaded or saved values; the drafts above are dirty against them.
  const [saved, setSaved] = useState(null);
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
  const [credentialUsage, setCredentialUsage] = useState(null);

  useEffect(() => {
    loadUserData();
    loadCloudCredentials();
  }, []);

  // The command palette's "Add AWS credentials" lands here with this state:
  // open the add dialog once, then drop the state so reload/back don't reopen.
  useEffect(() => {
    if (location.state?.addCredential) {
      handleAddCredential("aws");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]);

  // Leaving a page drops its unsaved edits (the save bar asked first).
  useEffect(() => {
    if (saved) discardChanges();
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      setUserStatus("loading");
      const [userResponse, preferencesResponse] = await Promise.all([
        authService.get("/users/me"),
        authService.get("/users/me/preferences"),
      ]);

      const loadedProfile = {
        firstName: userResponse.firstName || "",
        lastName: userResponse.lastName || "",
        email: userResponse.email || "",
      };
      setProfile(loadedProfile);
      setUserPreferences(preferencesResponse.preferences);
      setSaved({
        profile: loadedProfile,
        preferences: preferencesResponse.preferences,
      });
      if (preferencesResponse.preferences?.gitIntegration) {
        setGitIntegration(preferencesResponse.preferences.gitIntegration);
      }
      setUserStatus("ready");
    } catch (error) {
      console.error("Failed to load user data:", error);
      setUserStatus("error");
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

  const discardChanges = () => {
    setProfile(saved.profile);
    setUserPreferences(saved.preferences);
  };

  const loadCloudCredentials = async () => {
    try {
      const response = await authService.get("/cloud-credentials");
      setCloudCredentials(response.credentials || []);
      setCredentialsStatus("ready");
    } catch (error) {
      console.error("Failed to load cloud credentials:", error);
      setCredentialsStatus("error");
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
      setSaved({ profile, preferences: userPreferences });
      toast.success("Changes saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      const message = error.data?.error || error.message;
      const errorId = error.requestId ? ` (Error ID: ${error.requestId})` : "";
      toast.error(`Couldn't save your changes: ${message}${errorId}`);
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
      toast.error(`Couldn't load ${credential.name}. Try again.`);
    }
  };

  const handleDeleteCredential = async (credential) => {
    setCredentialToDelete(credential);
    setCredentialUsage(null);
    try {
      const usage = await authService.get(
        `/cloud-credentials/${credential.id}/usage`,
      );
      setCredentialUsage(usage);
    } catch (error) {
      console.error("Failed to load credential usage:", error);
      setCredentialUsage({ checkFailed: true });
    }
    setShowDeleteModal(true);
  };

  // The dialog closes after this returns, also after a failure (toasted here).
  const confirmDelete = async () => {
    try {
      await authService.delete(`/cloud-credentials/${credentialToDelete.id}`);
      await loadCloudCredentials();
      setShowDeleteModal(false);
      toast.success(`Deleted ${credentialToDelete.name}.`);
      setCredentialToDelete(null);
      setCredentialUsage(null);
    } catch (error) {
      console.error("Failed to delete credential:", error);
      const message =
        error.data?.error || error.message || "Failed to delete credential";
      const errorId = error.requestId ? ` (Error ID: ${error.requestId})` : "";
      toast.error(`${message}${errorId}`, {
        title: `Couldn't delete ${credentialToDelete.name}`,
      });
    }
  };

  const handleSaveCredential = async (credentialData) => {
    try {
      if (selectedCredential) {
        await authService.put(
          `/cloud-credentials/${selectedCredential.id}`,
          credentialData,
        );
        toast.success(`Saved ${credentialData.name}.`);
      } else {
        await authService.post("/cloud-credentials", credentialData);
        toast.success(`Added ${credentialData.name}.`);
      }
      await loadCloudCredentials();
      setShowCredentialModal(false);
      setSelectedCredential(null);
    } catch (error) {
      console.error("Failed to save credential:", error);
      const message =
        error.data?.error || error.message || "Failed to save credential";
      const errorId = error.requestId ? ` (Error ID: ${error.requestId})` : "";
      toast.error(`${message}${errorId}`, {
        title: "Couldn't save the credentials",
        duration: 7000,
      });
    }
  };

  const tab = SETTINGS_TABS.find((t) => t.id === activeTab);
  if (!tab) {
    return <Navigate to="/settings/account" replace />;
  }

  const onCredentials = activeTab === "cloud-credentials";
  const status = onCredentials ? credentialsStatus : userStatus;
  const dirty =
    userStatus === "ready" &&
    (activeTab === "account"
      ? changed(profile, saved.profile)
      : changed(userPreferences, saved.preferences));

  return (
    <>
      <PageShell width="settings">
        {status === "loading" ? (
          <SettingsPageSkeleton />
        ) : (
          <>
            <PageHeader title={tab.label} description={tab.description} />
            <Separator />
            <div className="flex flex-col gap-8">
              {status === "error" ? (
                <ErrorState
                  thing={
                    onCredentials ? "your cloud credentials" : "your settings"
                  }
                  onRetry={() => {
                    if (onCredentials) {
                      setCredentialsStatus("loading");
                      loadCloudCredentials();
                    } else {
                      loadUserData();
                    }
                  }}
                />
              ) : null}
              {status === "ready" && activeTab === "account" ? (
                <AccountTab
                  profile={profile}
                  onProfileChange={handleProfileChange}
                />
              ) : null}
              {status === "ready" && activeTab === "preferences" ? (
                <PreferencesTab
                  userPreferences={userPreferences}
                  onPreferenceChange={handlePreferenceChange}
                />
              ) : null}
              {status === "ready" && onCredentials ? (
                <CloudCredentialsTab
                  credentials={cloudCredentials}
                  onAddCredential={handleAddCredential}
                  onEditCredential={handleEditCredential}
                  onDeleteCredential={handleDeleteCredential}
                />
              ) : null}
            </div>
            {!onCredentials ? (
              <SaveBar
                dirty={dirty}
                saving={saving}
                onSave={saveSettings}
                onDiscard={discardChanges}
              />
            ) : null}
          </>
        )}
      </PageShell>

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
            setCredentialUsage(null);
          }}
          onConfirm={confirmDelete}
          isOpen={showDeleteModal}
          title={`Delete "${credentialToDelete.name}"?`}
          message="OpenPrime deletes its copy of the keys. The access key itself stays active in AWS."
          warningData={credentialUsage}
        />
      )}
    </>
  );
};

export default SettingsPage;
