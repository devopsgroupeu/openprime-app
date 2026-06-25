// src/components/Navigation.js
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import openPrimeLogoBlack from "../assets/openprime-logo-color-black.svg";
import openPrimeLogoWhite from "../assets/openprime-logo-color-white.svg";

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <nav
      className="relative z-10 p-4 backdrop-blur-md border-b border-border bg-surface/80"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-12">
          <Link to="/" className="flex items-center group">
            <img
              src={isDark ? openPrimeLogoWhite : openPrimeLogoBlack}
              alt="OpenPrime"
              className="h-8 w-auto transition-opacity group-hover:opacity-80"
              aria-hidden="true"
            />
          </Link>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6" role="menubar">
              <Link
                to="/environments"
                className={`font-medium font-poppins transition-colors duration-200 ${
                  location.pathname.startsWith("/environments")
                    ? "text-primary"
                    : "text-secondary hover:text-primary"
                }`}
                aria-current={location.pathname.startsWith("/environments") ? "page" : undefined}
                role="menuitem"
              >
                Environments
              </Link>
              <Link
                to="/settings"
                className={`font-medium font-poppins transition-colors duration-200 ${
                  location.pathname === "/settings"
                    ? "text-primary"
                    : "text-secondary hover:text-primary"
                }`}
                aria-current={location.pathname === "/settings" ? "page" : undefined}
                role="menuitem"
              >
                Settings
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-elevated transition-colors duration-200"
                aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
                title={`Switch to ${isDark ? "light" : "dark"} theme`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-elevated transition-colors duration-200"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium font-poppins">{user?.username}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-elevation-3 z-50 bg-surface border border-border backdrop-blur-md animate-scale-in">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm border-b border-border-subtle">
                        <div className="font-medium font-poppins text-primary">
                          {user?.fullName || user?.username}
                        </div>
                        {user?.email && (
                          <div className="text-xs font-poppins text-tertiary">{user.email}</div>
                        )}
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm font-poppins transition-colors duration-200 text-secondary hover:bg-background-secondary hover:text-primary"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm font-poppins transition-colors duration-200 text-danger hover:bg-danger-muted"
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
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
