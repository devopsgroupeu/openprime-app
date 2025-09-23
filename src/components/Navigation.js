// src/components/Navigation.js
import { Box, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import UserProfile from "./UserProfile";

const Navigation = ({ setCurrentPage, currentPage }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <nav
      className={`relative z-10 px-8 py-6 backdrop-blur-md border-b transition-colors ${
        isDark ? "bg-gray-900/95 border-gray-700" : "bg-white/95 border-gray-200 shadow-sm"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Box className="w-8 h-8 text-teal-500" aria-hidden="true" />
          <span
            className={`text-2xl font-bold transition-colors ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            OpenPrime
          </span>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8" role="menubar">
            <button
              onClick={() => setCurrentPage("home")}
              className={`font-medium transition-colors ${
                currentPage === "home"
                  ? isDark
                    ? "text-teal-400"
                    : "text-teal-600"
                  : isDark
                    ? "text-gray-300 hover:text-teal-400"
                    : "text-gray-600 hover:text-teal-600"
              }`}
              aria-current={currentPage === "home" ? "page" : undefined}
              role="menuitem"
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("environments")}
              className={`font-medium transition-colors ${
                currentPage === "environments"
                  ? isDark
                    ? "text-teal-400"
                    : "text-teal-600"
                  : isDark
                    ? "text-gray-300 hover:text-teal-400"
                    : "text-gray-600 hover:text-teal-600"
              }`}
              aria-current={currentPage === "environments" ? "page" : undefined}
              role="menuitem"
            >
              Environments
            </button>
            <button
              onClick={() => setCurrentPage("settings")}
              className={`font-medium transition-colors ${
                currentPage === "settings"
                  ? isDark
                    ? "text-teal-400"
                    : "text-teal-600"
                  : isDark
                    ? "text-gray-300 hover:text-teal-400"
                    : "text-gray-600 hover:text-teal-600"
              }`}
              aria-current={currentPage === "settings" ? "page" : undefined}
              role="menuitem"
            >
              Settings
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <UserProfile />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
