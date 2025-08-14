// src/components/SettingsPage.js
import React from 'react';
import { Cloud, GitBranch, Shield, Terminal } from 'lucide-react';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className={`text-3xl font-bold mb-8 transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`backdrop-blur-sm rounded-xl border p-6 transition-colors ${
            isDark
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Cloud className="w-5 h-5 mr-2 text-purple-400" />
              Cloud Providers
            </h2>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <div className="flex items-center">
                  <Cloud className="w-6 h-6 text-orange-400 mr-3" />
                  <div>
                    <div className="text-white font-semibold">AWS</div>
                    <div className="text-sm text-gray-400">Amazon Web Services</div>
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
                    <div className="text-white font-semibold">Azure</div>
                    <div className="text-sm text-gray-400">Microsoft Azure</div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all">
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
              <GitBranch className="w-5 h-5 mr-2 text-purple-400" />
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
              <Shield className="w-5 h-5 mr-2 text-purple-400" />
              Security & Compliance
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Enforce MFA</div>
                  <div className="text-sm text-gray-400">Require multi-factor authentication</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Encryption at Rest</div>
                  <div className="text-sm text-gray-400">Encrypt all data stored</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
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
              <Terminal className="w-5 h-5 mr-2 text-purple-400" />
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
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
