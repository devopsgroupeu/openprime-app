// src/components/HomePage.js
import React from 'react';
import { ChevronRight, Cloud, Layers, FileCode } from 'lucide-react';
import Navigation from './Navigation';

const HomePage = ({ setCurrentPage, currentPage }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">Deploy Anywhere with OpenPrime</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Configure and deploy your infrastructure on-premise or in AWS cloud with a single platform.
          </p>
          <button 
            onClick={() => setCurrentPage('environments')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Get Started
            <ChevronRight className="inline-block ml-2 w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <Cloud className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">Multi-Cloud Support</h3>
            <p className="text-gray-300">Deploy to AWS or on-premise infrastructure.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <Layers className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">Helm Integration</h3>
            <p className="text-gray-300">Deploy Prometheus, Grafana, and more with custom values.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <FileCode className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">IaC Export</h3>
            <p className="text-gray-300">Download your infrastructure as Terraform code.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;