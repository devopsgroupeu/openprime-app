// src/components/SettingsPage.js
import React, { useState, useEffect } from "react";
import {
  Cloud,
  GitBranch,
  Shield,
  Terminal,
  User,
  Save,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import Navigation from "./Navigation";
import { useTheme } from "../contexts/ThemeContext";
import authService from "../services/authService";
import CloudCredentialModal from "./modals/CloudCredentialModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

const SettingsPage = () => {
  const { isDark } = useTheme();
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
  const [cloudCredentials, setCloudCredentials] = useState([]);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState("aws");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState(null);

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
        authService.put("/users/me/preferences", userPreferences),
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
      setCredentialToDelete(null);
    } catch (error) {
      console.error("Failed to delete credential:", error);
    }
  };

  const handleSaveCredential = async (credentialData) => {
    try {
      if (selectedCredential) {
        await authService.put(
          `/cloud-credentials/${selectedCredential.id}`,
          credentialData,
        );
      } else {
        await authService.post("/cloud-credentials", credentialData);
      }
      await loadCloudCredentials();
      setShowCredentialModal(false);
      setSelectedCredential(null);
    } catch (error) {
      console.error("Failed to save credential:", error);
    }
  };
  if (loading) {
    return (
      <div
        className={`min-h-screen transition-colors ${isDark ? "bg-background" : "bg-background"}`}
      >
        <Navigation />
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p
                className={`text-lg font-poppins ${isDark ? "text-white" : "text-primary"}`}
              >
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${isDark ? "bg-background" : "bg-background"}`}
    >
      <Navigation />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1
          className={`text-3xl font-bold font-sora mb-8 transition-colors ${
            isDark ? "text-white" : "text-primary"
          }`}
        >
          Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile Section */}
          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-bold font-sora mb-4 flex items-center transition-colors ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              <User className="w-5 h-5 mr-2 text-primary" />
              User Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium font-poppins mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) =>
                    handleProfileChange("firstName", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) =>
                    handleProfileChange("lastName", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* User Preferences Section */}
          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center transition-colors ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Default Cloud Provider
                </label>
                <select
                  value={userPreferences.defaultProvider}
                  onChange={(e) =>
                    handlePreferenceChange("defaultProvider", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                >
                  <option value="aws">AWS</option>
                  <option value="azure">Azure</option>
                  <option value="gcp">Google Cloud</option>
                  <option value="on-premise">On-Premise</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Default Region
                </label>
                <input
                  type="text"
                  value={userPreferences.defaultRegion}
                  onChange={(e) =>
                    handlePreferenceChange("defaultRegion", e.target.value)
                  }
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  placeholder="us-east-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`font-medium transition-colors ${
                      isDark ? "text-white" : "text-primary"
                    }`}
                  >
                    Email Notifications
                  </div>
                  <div
                    className={`text-sm transition-colors ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Receive deployment notifications
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={userPreferences.notifications}
                    onChange={(e) =>
                      handlePreferenceChange("notifications", e.target.checked)
                    }
                  />
                  <div
                    className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDark ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  ></div>
                </label>
              </div>
            </div>
          </div>
          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold flex items-center transition-colors ${
                  isDark ? "text-white" : "text-primary"
                }`}
              >
                <Cloud className="w-5 h-5 mr-2 text-primary" />
                AWS Credentials
              </h2>
              <button
                onClick={() => handleAddCredential("aws")}
                className="px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {cloudCredentials.filter((c) => c.provider === "aws").length ===
              0 ? (
                <div
                  className={`text-center py-8 transition-colors ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
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
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        isDark ? "bg-gray-700/50" : "bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center flex-1">
                        <Cloud className="w-6 h-6 text-orange-400 mr-3" />
                        <div>
                          <div
                            className={`font-semibold transition-colors ${
                              isDark ? "text-white" : "text-primary"
                            }`}
                          >
                            {credential.name}
                            {credential.isDefault && (
                              <span className="ml-2 px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-sm transition-colors ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Account: {credential.identifier}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCredential(credential)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-600 text-gray-400 hover:text-white"
                              : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(credential)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "hover:bg-red-900/20 text-gray-400 hover:text-red-400"
                              : "hover:bg-red-100 text-gray-600 hover:text-red-600"
                          }`}
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

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center transition-colors ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              <GitBranch className="w-5 h-5 mr-2 text-primary" />
              Git Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Repository URL
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  placeholder="https://github.com/your-org/infrastructure"
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors ${
                    isDark ? "text-tertiary" : "text-secondary"
                  }`}
                >
                  Default Branch
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-primary"
                  }`}
                  defaultValue="main"
                />
              </div>
            </div>
          </div>

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center transition-colors ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Security & Compliance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`font-medium transition-colors ${
                      isDark ? "text-white" : "text-primary"
                    }`}
                  >
                    Enforce MFA
                  </div>
                  <div
                    className={`text-sm transition-colors ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Require multi-factor authentication
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div
                    className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDark ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  ></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`font-medium transition-colors ${
                      isDark ? "text-white" : "text-primary"
                    }`}
                  >
                    Encryption at Rest
                  </div>
                  <div
                    className={`text-sm transition-colors ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Encrypt all data stored
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div
                    className={`w-11 h-6 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDark ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  ></div>
                </label>
              </div>
            </div>
          </div>

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
              isDark
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 flex items-center transition-colors ${
                isDark ? "text-white" : "text-primary"
              }`}
            >
              <Terminal className="w-5 h-5 mr-2 text-primary" />
              CLI Configuration
            </h2>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
              <div className="text-gray-400"># Install OpenPrime CLI</div>
              <div className="text-green-400">
                $ npm install -g openprime-cli
              </div>
              <div className="text-gray-400 mt-2"># Configure credentials</div>
              <div className="text-green-400">$ openprime configure</div>
              <div className="text-gray-400 mt-2"># Deploy environment</div>
              <div className="text-green-400">
                $ openprime deploy production
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
