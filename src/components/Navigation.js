// src/components/Navigation.js
import React from 'react';
import { Box } from 'lucide-react';

const Navigation = ({ setCurrentPage, currentPage }) => {
  return (
    <nav className="relative z-10 px-8 py-6 bg-black/20 backdrop-blur-md border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Box className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold text-white">OpenPrime</span>
        </div>
        <div className="flex space-x-8">
          <button 
            onClick={() => setCurrentPage('home')} 
            className={`${currentPage === 'home' ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('environments')} 
            className={`${currentPage === 'environments' ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors`}
          >
            Environments
          </button>
          <button 
            onClick={() => setCurrentPage('settings')} 
            className={`${currentPage === 'settings' ? 'text-white' : 'text-gray-300'} hover:text-white transition-colors`}
          >
            Settings
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;