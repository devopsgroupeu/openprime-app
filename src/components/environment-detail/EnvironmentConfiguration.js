import React, { useState } from "react";
import {
  Download,
  Copy,
  Code,
  FileText,
  Package,
  GitBranch,
  Database,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";

const EnvironmentConfiguration = ({ environment }) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [format, setFormat] = useState("json");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSshKey, setShowSshKey] = useState(false);

  const generateConfiguration = () => {
    const config = {
      name: environment.name,
      provider: environment.provider,
      region: environment.region,
      status: environment.status,
      services: environment.services || {},
      createdAt: environment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (environment.cloudCredential) {
      config.cloudCredential = {
        name: environment.cloudCredential.name,
        identifier: environment.cloudCredential.identifier,
        provider: environment.cloudCredential.provider,
      };
    }

    if (environment.terraform_backend) {
      config.terraformBackend = environment.terraform_backend;
    }

    if (environment.git_repository) {
      config.gitRepository = environment.git_repository;
    }

    return config;
  };

  const formatAsYAML = (obj, indent = 0) => {
    const spaces = "  ".repeat(indent);
    let yaml = "";

    Object.entries(obj).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${formatAsYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === "object") {
            yaml += `${spaces}  -\n${formatAsYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === "string") {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    });

    return yaml;
  };

  const getFormattedContent = () => {
    const config = generateConfiguration();

    if (format === "yaml") {
      return formatAsYAML(config);
    } else {
      return JSON.stringify(config, null, 2);
    }
  };

  const downloadConfiguration = () => {
    const content = getFormattedContent();
    const fileName = `${environment.name}-config.${format}`;
    const mimeType = format === "yaml" ? "text/yaml" : "application/json";

    const dataBlob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    success(`Configuration downloaded as ${fileName}`);
  };

  const copyToClipboard = () => {
    const content = getFormattedContent();
    navigator.clipboard.writeText(content).then(() => {
      success(`${format.toUpperCase()} configuration copied to clipboard`);
    });
  };

  const generateInfrastructure = async () => {
    try {
      setIsGenerating(true);

      const response = await authService.post(
        `/environments/${environment.id}/generate`,
        {},
        {
          responseType: "blob",
          timeout: 120000,
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${environment.name}-infrastructure.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success("Infrastructure repository generated and downloaded successfully");
    } catch (err) {
      console.error("Error generating infrastructure:", err);
      showError(
        err.response?.data?.error || "Failed to generate infrastructure. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };
  const content = getFormattedContent();

  return (
    <div className="space-y-6">
      {/* Terraform Backend Configuration */}
      {environment.terraform_backend?.enabled && (
        <div
          className={`p-6 rounded-xl border ${
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white/70 border-gray-200"
          }`}
        >
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 mr-2 text-teal-500" />
            <h4 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Terraform Backend Configuration
            </h4>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {environment.terraform_backend.bucketName && (
                <div>
                  <p
                    className={`text-xs font-medium mb-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    S3 Bucket
                  </p>
                  <div className="flex items-center space-x-2">
                    <p
                      className={`text-sm font-mono ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {environment.terraform_backend.bucketName}
                    </p>
                    <a
                      href={`https://${environment.region}.console.aws.amazon.com/s3/buckets/${environment.terraform_backend.bucketName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-500 hover:text-teal-400"
                      title="Open in AWS Console"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p
                  className={`text-xs font-medium mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Locking Mechanism
                </p>
                <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  {environment.terraform_backend.lockingMechanism === "s3"
                    ? "S3 Native Locking"
                    : "DynamoDB"}
                </p>
              </div>
              {environment.terraform_backend.lockingMechanism === "dynamodb" &&
                environment.terraform_backend.tableName && (
                  <div>
                    <p
                      className={`text-xs font-medium mb-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      DynamoDB Table
                    </p>
                    <p
                      className={`text-sm font-mono ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {environment.terraform_backend.tableName}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Git Repository Configuration */}
      {environment.git_repository?.enabled && (
        <div
          className={`p-6 rounded-xl border ${
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white/70 border-gray-200"
          }`}
        >
          <div className="flex items-center mb-4">
            <GitBranch className="w-5 h-5 mr-2 text-teal-500" />
            <h4 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
              Git Repository Configuration
            </h4>
          </div>
          <div className="space-y-4">
            <div>
              <p
                className={`text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Repository URL
              </p>
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-mono ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  {environment.git_repository.url}
                </p>
                {environment.git_repository.url.includes("github.com") && (
                  <a
                    href={environment.git_repository.url
                      .replace("git@github.com:", "https://github.com/")
                      .replace(".git", "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-500 hover:text-teal-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <p
                className={`text-xs font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                SSH Private Key
              </p>
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg ${
                  isDark ? "bg-gray-900/50" : "bg-gray-100"
                }`}
              >
                <Key className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <p
                  className={`text-xs font-mono flex-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } ${showSshKey ? "break-all" : ""}`}
                >
                  {environment.git_repository.sshKey
                    ? showSshKey
                      ? environment.git_repository.sshKey
                      : "••••••••••••••••••••"
                    : "Not configured"}
                </p>
                {environment.git_repository.sshKey && (
                  <button
                    onClick={() => setShowSshKey(!showSshKey)}
                    className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${
                      isDark
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    title={showSshKey ? "Hide key" : "Show key"}
                  >
                    {showSshKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
          Environment Configuration
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setFormat("json")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === "json"
                  ? isDark
                    ? "bg-teal-600 text-white"
                    : "bg-teal-600 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              JSON
            </button>
            <button
              onClick={() => setFormat("yaml")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === "yaml"
                  ? isDark
                    ? "bg-teal-600 text-white"
                    : "bg-teal-600 text-white"
                  : isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              YAML
            </button>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Copy className="w-4 h-4 inline mr-2" />
            Copy
          </button>
          <button
            onClick={downloadConfiguration}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
          <button
            onClick={generateInfrastructure}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isGenerating
                ? "bg-gray-500 cursor-not-allowed text-white"
                : isDark
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            {isGenerating ? "Generating..." : "Generate Repository"}
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg border ${
          isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div
          className={`px-4 py-3 border-b text-sm font-medium flex items-center justify-between ${
            isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"
          }`}
        >
          <span>
            {environment.name} - {format.toUpperCase()} Configuration
          </span>
          <span className="text-xs opacity-75">{content.split("\n").length} lines</span>
        </div>
        <div className="relative">
          <pre
            className={`p-4 text-sm font-mono overflow-auto max-h-96 ${
              isDark ? "text-gray-300" : "text-gray-800"
            }`}
          >
            <code>{content}</code>
          </pre>
        </div>
      </div>

      <div
        className={`p-4 rounded-lg border-l-4 ${
          isDark
            ? "bg-blue-900/20 border-blue-500/50 text-blue-300"
            : "bg-blue-50 border-blue-500 text-blue-700"
        }`}
      >
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Configuration Export</p>
            <p className="text-sm opacity-90">
              This configuration represents the complete state of your environment including all
              services, settings, and metadata. You can use this to backup, version control, or
              recreate this environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentConfiguration;
