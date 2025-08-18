// src/components/HomePage.js
import React from "react";
import { ChevronRight, Cloud, Layers, FileCode, Zap, Check, Gauge, Globe, Package, Users } from "lucide-react";
import Navigation from "./Navigation";
import { useTheme } from "../contexts/ThemeContext";

const HomePage = ({ setCurrentPage, currentPage }) => {
  const { isDark } = useTheme();
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      }`}
    >
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm mb-8 backdrop-blur-sm border border-purple-500/30">
            <Zap className="w-4 h-4 mr-2" />
            Infrastructure as Code, Simplified
          </div>
          <h1
            className={`text-6xl font-bold mb-6 transition-colors ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Deploy Anywhere with OpenPrime
          </h1>
          <p
            className={`text-xl max-w-3xl mx-auto mb-8 transition-colors ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Configure and deploy your infrastructure on-premise or in AWS cloud
            with a single platform.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setCurrentPage("environments")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Get Started
              <ChevronRight className="inline-block ml-2 w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20">
              View Documentation
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div
            className={`backdrop-blur-md rounded-xl p-8 border transition-colors ${
              isDark
                ? "bg-white/10 border-white/20"
                : "bg-white/60 border-gray-200"
            }`}
          >
            <Cloud className="w-12 h-12 text-purple-400 mb-4" />
            <h3
              className={`text-xl font-bold mb-3 transition-colors ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Multi-Cloud Support
            </h3>
            <p
              className={`transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Deploy to AWS or on-premise infrastructure.
            </p>
          </div>
          <div
            className={`backdrop-blur-md rounded-xl p-8 border transition-colors ${
              isDark
                ? "bg-white/10 border-white/20"
                : "bg-white/60 border-gray-200"
            }`}
          >
            <Layers className="w-12 h-12 text-purple-400 mb-4" />
            <h3
              className={`text-xl font-bold mb-3 transition-colors ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Helm Integration
            </h3>
            <p
              className={`transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Deploy Prometheus, Grafana, and more with custom values.
            </p>
          </div>
          <div
            className={`backdrop-blur-md rounded-xl p-8 border transition-colors ${
              isDark
                ? "bg-white/10 border-white/20"
                : "bg-white/60 border-gray-200"
            }`}
          >
            <FileCode className="w-12 h-12 text-purple-400 mb-4" />
            <h3
              className={`text-xl font-bold mb-3 transition-colors ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              IaC Export
            </h3>
            <p
              className={`transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Download your infrastructure as Terraform code.
            </p>
          </div>
        </div>
        <div className="mt-20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-12 backdrop-blur-md border border-purple-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Enterprise-Ready Infrastructure
              </h2>
              <p className="text-gray-300 mb-6">
                OpenPrime provides a unified platform for managing complex
                infrastructure deployments with enterprise-grade security and
                compliance.
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  GitOps ready with ArgoCD integration
                </div>
                <div className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  Built-in security best practices
                </div>
                <div className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-400 mr-3" />
                  Automated backup and disaster recovery
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Gauge className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">Uptime SLA</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Globe className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">15+</div>
                <div className="text-sm text-gray-400">AWS Regions</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Package className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-gray-400">Helm Charts</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Users className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">1000+</div>
                <div className="text-sm text-gray-400">Deployments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
