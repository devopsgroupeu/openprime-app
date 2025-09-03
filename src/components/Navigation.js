// src/components/Navigation.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Sun, Moon, User, LogOut, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <nav
      className={`relative z-10 px-8 py-6 backdrop-blur-md border-b transition-colors ${
        isDark
          ? 'bg-gray-900/95 border-gray-700'
          : 'bg-white/95 border-gray-200 shadow-sm'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Box className="w-8 h-8 text-teal-500" aria-hidden="true" />
          <span className={`text-2xl font-bold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>OpenPrime</span>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8" role="menubar">
            <Link
              to="/environments"
              className={`font-medium transition-colors ${
                location.pathname.startsWith('/environments')
                  ? (isDark ? 'text-teal-400' : 'text-teal-600')
                  : (isDark ? 'text-gray-300 hover:text-teal-400' : 'text-gray-600 hover:text-teal-600')
              }`}
              aria-current={location.pathname.startsWith('/environments') ? 'page' : undefined}
              role="menuitem"
            >
              Environments
            </Link>
            <Link
              to="/settings"
              className={`font-medium transition-colors ${
                location.pathname === '/settings'
                  ? (isDark ? 'text-teal-400' : 'text-teal-600')
                  : (isDark ? 'text-gray-300 hover:text-teal-400' : 'text-gray-600 hover:text-teal-600')
              }`}
              aria-current={location.pathname === '/settings' ? 'page' : undefined}
              role="menuitem"
            >
              Settings
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">{user?.fullName || user?.username || 'User'}</span>
            </button>

            {isUserMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${
                isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="py-1">
                  <div className={`px-4 py-2 text-sm border-b ${
                    isDark
                      ? 'text-gray-300 border-gray-700'
                      : 'text-gray-700 border-gray-200'
                  }`}>
                    <div className="font-medium">{user?.fullName || user?.username}</div>
                    {user?.email && (
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.email}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                      isDark
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                      isDark
                        ? 'text-red-400 hover:bg-gray-700'
                        : 'text-red-600 hover:bg-gray-100'
                    }`}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
