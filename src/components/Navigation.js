// src/components/Navigation.js
import React from 'react';
import { Box, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = ({ setCurrentPage, currentPage }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <nav className={`relative z-10 px-8 py-6 backdrop-blur-md border-b transition-colors ${
      isDark
        ? 'bg-black/20 border-gray-700'
        : 'bg-white/20 border-gray-300'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Box className="w-8 h-8 text-purple-400" />
          <span className={`text-2xl font-bold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>OpenPrime</span>
        </div>
        <div className="flex items-center space-x-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentPage('home')}
              className={`transition-colors ${
                currentPage === 'home'
                  ? (isDark ? 'text-white' : 'text-gray-900')
                  : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('environments')}
              className={`transition-colors ${
                currentPage === 'environments'
                  ? (isDark ? 'text-white' : 'text-gray-900')
                  : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Environments
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`transition-colors ${
                currentPage === 'settings'
                  ? (isDark ? 'text-white' : 'text-gray-900')
                  : (isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Settings
            </button>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
