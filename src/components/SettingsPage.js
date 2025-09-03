// src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Cloud, GitBranch, Shield, Terminal, User, Save } from 'lucide-react';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';

const SettingsPage = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();
  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    notifications: true,
    defaultProvider: 'aws',
    defaultRegion: 'us-east-1'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userResponse, preferencesResponse] = await Promise.all([
        authService.get('/users/me'),
        authService.get('/users/me/preferences')
      ]);

      setProfile({
        firstName: userResponse.firstName || '',
        lastName: userResponse.lastName || '',
        email: userResponse.email || ''
      });

      setUserPreferences(preferencesResponse.preferences);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        authService.put('/users/me/profile', profile),
        authService.put('/users/me/preferences', userPreferences)
      ]);
      // Show success message or toast here
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error message here
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900'
          : 'bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50'
      }`}>
        <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900'
        : 'bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50'
    }`}>
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className={`text-3xl font-bold mb-8 transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile Section */}
          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <User className="w-5 h-5 mr-2 text-teal-500" />
              User Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* User Preferences Section */}
          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Shield className="w-5 h-5 mr-2 text-teal-500" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Default Cloud Provider</label>
                <select
                  value={userPreferences.defaultProvider}
                  onChange={(e) => handlePreferenceChange('defaultProvider', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="aws">AWS</option>
                  <option value="azure">Azure</option>
                  <option value="gcp">Google Cloud</option>
                  <option value="on-premise">On-Premise</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Default Region</label>
                <input
                  type="text"
                  value={userPreferences.defaultRegion}
                  onChange={(e) => handlePreferenceChange('defaultRegion', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="us-east-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Email Notifications</div>
                  <div className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Receive deployment notifications</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={userPreferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                </label>
              </div>
            </div>
          </div>
          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Cloud className="w-5 h-5 mr-2 text-teal-500" />
              Cloud Providers
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <div className="flex items-center">
                  <Cloud className="w-6 h-6 text-orange-400 mr-3" />
                  <div>
                    <div className={`font-semibold transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>AWS</div>
                    <div className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Amazon Web Services</div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Connected</span>
              </div>
              <div className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <div className="flex items-center">
                  <Cloud className="w-6 h-6 text-blue-400 mr-3" />
                  <div>
                    <div className={`font-semibold transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Azure</div>
                    <div className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Microsoft Azure</div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg hover:bg-teal-600/30 transition-all">
                  Connect
                </button>
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <GitBranch className="w-5 h-5 mr-2 text-teal-500" />
              Git Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Repository URL</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="https://github.com/your-org/infrastructure"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Default Branch</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  defaultValue="main"
                />
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Shield className="w-5 h-5 mr-2 text-teal-500" />
              Security & Compliance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Enforce MFA</div>
                  <div className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Require multi-factor authentication</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Encryption at Rest</div>
                  <div className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Encrypt all data stored</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                </label>
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Terminal className="w-5 h-5 mr-2 text-teal-500" />
              CLI Configuration
            </h2>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs">
              <div className="text-gray-400"># Install OpenPrime CLI</div>
              <div className="text-green-400">$ npm install -g openprime-cli</div>
              <div className="text-gray-400 mt-2"># Configure credentials</div>
              <div className="text-green-400">$ openprime configure</div>
              <div className="text-gray-400 mt-2"># Deploy environment</div>
              <div className="text-green-400">$ openprime deploy production</div>
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
    </div>
  );
};

export default SettingsPage;
