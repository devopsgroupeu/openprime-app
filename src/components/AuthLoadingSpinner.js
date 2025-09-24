// src/components/AuthLoadingSpinner.js
import React from "react";

const AuthLoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Authenticating...</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingSpinner;
