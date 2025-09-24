// src/components/UserProfile.js
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { User, LogOut, ChevronDown, ChevronUp } from "lucide-react";

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  // Theme-based class helpers
  const buttonClasses = `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
    isDark
      ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
  }`;

  const iconClasses = isDark ? "text-gray-300" : "text-gray-600";
  const chevronClasses = isDark ? "text-gray-400" : "text-gray-500";

  const dropdownClasses = `absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-[9999] ${
    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }`;

  const borderClasses = isDark ? "border-gray-700" : "border-gray-200";
  const textPrimaryClasses = isDark ? "text-white" : "text-gray-900";
  const textSecondaryClasses = isDark ? "text-gray-400" : "text-gray-500";
  const textTertiaryClasses = isDark ? "text-gray-300" : "text-gray-600";

  const roleClasses = isDark ? "bg-teal-900/30 text-teal-300" : "bg-teal-100 text-teal-800";

  const logoutClasses = `w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md transition-colors ${
    isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"
  }`;

  return (
    <div className="relative">
      <button onClick={() => setIsExpanded(!isExpanded)} className={buttonClasses}>
        <User className={`w-5 h-5 ${iconClasses}`} />
        <span className="text-sm font-medium">{user.name || user.username}</span>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${chevronClasses}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${chevronClasses}`} />
        )}
      </button>

      {isExpanded && (
        <div className={dropdownClasses}>
          <div className={`p-4 border-b ${borderClasses}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-sm font-medium ${textPrimaryClasses}`}>
                  {user.name || user.username}
                </p>
                {user.email && <p className={`text-xs ${textSecondaryClasses}`}>{user.email}</p>}
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="px-3 py-2">
              <p
                className={`text-xs font-medium uppercase tracking-wider mb-2 ${textSecondaryClasses}`}
              >
                User Information
              </p>
              <div className="space-y-1 text-xs">
                <p className={textTertiaryClasses}>
                  <span className="font-medium">Username:</span> {user.username}
                </p>
                {user.email && (
                  <p className={textTertiaryClasses}>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                )}
                {user.roles && user.roles.length > 0 && (
                  <div className="mt-2">
                    <p className={`font-medium mb-1 ${textTertiaryClasses}`}>Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span key={role} className={`px-2 py-1 rounded text-xs ${roleClasses}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={logout} className={logoutClasses}>
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
