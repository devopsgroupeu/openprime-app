// src/components/SettingsPage.jsx
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { SETTINGS_TABS } from "../config/nav";
import { useToast } from "../contexts/ToastContext";
import authService from "../services/authService";
import CloudCredentialModal from "./modals/CloudCredentialModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";
import AccountTab, { ACCOUNT_FIELDS } from "./settings-page/AccountTab";
import CloudCredentialsTab from "./settings-page/CloudCredentialsTab";
import PreferencesTab from "./settings-page/PreferencesTab";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";
import { SaveBar } from "@/components/shared/save-bar";
import { SettingsPageSkeleton } from "@/components/shared/skeletons";
import { ErrorState } from "@/components/shared/states";
import { Separator } from "@/components/ui/separator";
import { describeError } from "@/lib/describe-error";

// True when any top-level value differs (drafts are edited one key at a time).
const changed = (a, b) =>
  Object.keys({ ...a, ...b }).some((key) => a[key] !== b[key]);

// What to fix in the account form, by field. The backend takes empty values
// and checks the email fully; the form asks for both names and an email shape.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const accountErrors = ({ firstName, lastName, email }) => ({
  ...(!firstName.trim() && { firstName: "Enter your first name." }),
  ...(!lastName.trim() && { lastName: "Enter your last name." }),
  ...(!EMAIL_SHAPE.test(email) && {
    email: "Enter a valid email address.",
  }),
});

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
  // After a Save stopped by account problems: they show under their fields
  // (and go as they are fixed); the first one (its input id) takes the focus
  // once the account form is on screen.
  const [showAccountErrors, setShowAccountErrors] = useState(false);
  const [focusAccountError, setFocusAccountError] = useState(null);

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

  useEffect(() => {
    if (!focusAccountError || activeTab !== "account") return;
    setFocusAccountError(null);
    document.getElementById(focusAccountError)?.focus();
  }, [focusAccountError, activeTab]);

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
    setShowAccountErrors(false);
  };

  // Only an edited profile is checked; an untouched one saves as it is.
  const accountProblems = () =>
    changed(profile, saved.profile) ? accountErrors(profile) : {};

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
    const problems = accountProblems();
    const firstInvalid = ACCOUNT_FIELDS.find((field) => problems[field.key]);
    if (firstInvalid) {
      setShowAccountErrors(true);
      setFocusAccountError(firstInvalid.id);
      if (activeTab !== "account") navigate("/settings/account");
      return;
    }
    try {
      setSaving(true);
      await Promise.all([
        authService.put("/users/me/profile", profile),
        authService.put("/users/me/preferences", {
          ...userPreferences,
          gitIntegration,
        }),
      ]);
      // What was sent; edits typed during the PUT stay dirty against it.
      setSaved({ profile, preferences: userPreferences });
      setShowAccountErrors(false);
      toast.success("Changes saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(describeError(error, "save your changes"));
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
      toast.error(describeError(error, `delete ${credentialToDelete.name}`));
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
      toast.error(describeError(error, `save ${credentialData.name}`), {
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
  // The account and preferences drafts live across the tabs; either one
  // shows the save bar, on every tab, and Save sends both. Off the tab with
  // the edits, the bar names the tabs that hold them.
  const edited =
    userStatus === "ready"
      ? SETTINGS_TABS.filter(
          ({ id }) =>
            (id === "account" && changed(profile, saved.profile)) ||
            (id === "preferences" &&
              changed(userPreferences, saved.preferences)),
        )
      : [];
  const dirty = edited.length > 0;
  const saveLabel = edited.some(({ id }) => id !== activeTab)
    ? `Unsaved changes in ${edited.map((t) => t.label).join(" and ")}`
    : undefined;

  return (
    <>
      {/* Grows to the screen's height with the save bar, which rests at its end. */}
      <PageShell width="settings" className="grow">
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
                  errors={showAccountErrors ? accountProblems() : {}}
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
          </>
        )}
        <SaveBar
          dirty={dirty}
          saving={saving}
          onSave={saveSettings}
          onDiscard={discardChanges}
          within="/settings/"
          label={saveLabel}
        />
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
