// src/components/layout/AppHeader.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  BookOpen,
  Menu,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import openPrimeLogoBlack from "../../assets/openprime-logo-color-black.svg";
import openPrimeLogoWhite from "../../assets/openprime-logo-color-white.svg";

const DOCS_URL = "https://docs.openprime.io";

const AppHeader = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 h-20 border-b border-border bg-surface/80 backdrop-blur-md"
      role="banner"
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link
            to="/"
            className="flex items-center group"
            aria-label="OpenPrime home"
          >
            <img
              src={isDark ? openPrimeLogoWhite : openPrimeLogoBlack}
              alt="OpenPrime"
              className="h-8 w-auto transition-opacity group-hover:opacity-80"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Documentation</span>
          </a>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-elevated transition-colors duration-200"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-elevated transition-colors duration-200"
            >
              <span className="w-7 h-7 rounded-full bg-primary-muted flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </span>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.username}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-elevation-3 z-50 bg-surface border border-border backdrop-blur-md animate-scale-in">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm border-b border-border-subtle">
                    <div className="font-medium text-primary">
                      {user?.fullName || user?.username}
                    </div>
                    {user?.email && (
                      <div className="text-xs text-tertiary">{user.email}</div>
                    )}
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 text-secondary hover:bg-background-secondary hover:text-primary"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 text-danger hover:bg-danger-muted"
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
    </header>
  );
};

export default AppHeader;
