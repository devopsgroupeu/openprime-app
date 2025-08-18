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
          ? "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50"
      }`}
    >
      <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm mb-8 backdrop-blur-sm border ${
            isDark
              ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
              : "bg-teal-500/10 text-teal-700 border-teal-500/30"
          }`}>
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
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
              <ChevronRight className="inline-block ml-2 w-5 h-5" />
            </button>
            <button className={`px-8 py-4 backdrop-blur-md rounded-lg font-semibold transition-all border ${
              isDark
                ? "bg-white/10 text-white hover:bg-white/20 border-white/20"
                : "bg-white/60 text-gray-700 hover:bg-white/80 border-gray-200"
            }`}>
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
            <Cloud className="w-12 h-12 text-teal-500 mb-4" />
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
            <Layers className="w-12 h-12 text-teal-500 mb-4" />
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
            <FileCode className="w-12 h-12 text-teal-500 mb-4" />
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
        <div className={`mt-20 rounded-2xl p-12 backdrop-blur-md border ${
          isDark
            ? "bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border-teal-500/30"
            : "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-3xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Enterprise-Ready Infrastructure
              </h2>
              <p className={`mb-6 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}>
                OpenPrime provides a unified platform for managing complex
                infrastructure deployments with enterprise-grade security and
                compliance.
              </p>
              <div className="space-y-3">
                <div className={`flex items-center ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  <Check className="w-5 h-5 text-emerald-500 mr-3" />
                  GitOps ready with ArgoCD integration
                </div>
                <div className={`flex items-center ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  <Check className="w-5 h-5 text-emerald-500 mr-3" />
                  Built-in security best practices
                </div>
                <div className={`flex items-center ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  <Check className="w-5 h-5 text-emerald-500 mr-3" />
                  Automated backup and disaster recovery
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 backdrop-blur-sm ${
                isDark ? "bg-white/10" : "bg-white/50"
              }`}>
                <Gauge className="w-8 h-8 text-teal-500 mb-2" />
                <div className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>99.9%</div>
                <div className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>Uptime SLA</div>
              </div>
              <div className={`rounded-lg p-4 backdrop-blur-sm ${
                isDark ? "bg-white/10" : "bg-white/50"
              }`}>
                <Globe className="w-8 h-8 text-teal-500 mb-2" />
                <div className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>15+</div>
                <div className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>AWS Regions</div>
              </div>
              <div className={`rounded-lg p-4 backdrop-blur-sm ${
                isDark ? "bg-white/10" : "bg-white/50"
              }`}>
                <Package className="w-8 h-8 text-teal-500 mb-2" />
                <div className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>50+</div>
                <div className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>Helm Charts</div>
              </div>
              <div className={`rounded-lg p-4 backdrop-blur-sm ${
                isDark ? "bg-white/10" : "bg-white/50"
              }`}>
                <Users className="w-8 h-8 text-teal-500 mb-2" />
                <div className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>1000+</div>
                <div className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>Deployments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
