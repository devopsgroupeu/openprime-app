import { useState } from "react";
import {
  Download,
  Copy,
  Code,
  FileText,
  GitBranch,
  Database,
  Key,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";

// Lightweight, escaping-safe syntax highlighting.
// Renders a config string as colored React nodes (no HTML injection, no deps).
// Each line is split into safe spans via simple per-line regex; any line that
// doesn't match cleanly falls back to a plain text-secondary span.

// Tokenize a single JSON line into colored spans using a global regex.
const highlightJsonLine = (line, lineKey) => {
  // Capture, in order: object key ("..." before a colon), string value,
  // boolean/null, number, structural punctuation. Everything else (whitespace)
  // passes through untouched as the default span.
  const tokenRegex =
    /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g;

  const spans = [];
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      spans.push(
        <span key={`${lineKey}-d${i++}`} className="text-secondary">
          {line.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const [, key, str, bool, num, punct] = match;
    if (key !== undefined) {
      spans.push(
        <span key={`${lineKey}-t${i++}`} className="text-accent">
          {key}
        </span>,
      );
    } else if (str !== undefined) {
      spans.push(
        <span key={`${lineKey}-t${i++}`} className="text-success">
          {str}
        </span>,
      );
    } else if (bool !== undefined) {
      spans.push(
        <span key={`${lineKey}-t${i++}`} className="text-info">
          {bool}
        </span>,
      );
    } else if (num !== undefined) {
      spans.push(
        <span key={`${lineKey}-t${i++}`} className="text-warning">
          {num}
        </span>,
      );
    } else {
      spans.push(
        <span key={`${lineKey}-t${i++}`} className="text-tertiary">
          {punct}
        </span>,
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    spans.push(
      <span key={`${lineKey}-d${i}`} className="text-secondary">
        {line.slice(lastIndex)}
      </span>,
    );
  }

  return spans.length > 0 ? spans : line;
};

// Tokenize a single YAML line: full-line comments, key part, value part.
const highlightYamlLine = (line) => {
  // Full-line comment (allowing leading whitespace).
  if (/^\s*#/.test(line)) {
    return <span className="text-tertiary italic">{line}</span>;
  }

  // key: value  -> split on the first colon, preserving exact substrings.
  const match = line.match(/^(\s*[^:\n]+:)(.*)$/);
  if (match) {
    const [, keyPart, valuePart] = match;
    return (
      <>
        <span className="text-accent">{keyPart}</span>
        <span className="text-secondary">{valuePart}</span>
      </>
    );
  }

  // No clean match (e.g. list items, blank lines) -> plain secondary.
  return <span className="text-secondary">{line}</span>;
};

// Render a full config string as line-broken, colored React nodes.
const highlightContent = (content, format) => {
  const lines = content.split("\n");
  return lines.map((line, index) => {
    const lineKey = `line-${index}`;
    const nodes =
      format === "yaml"
        ? highlightYamlLine(line)
        : highlightJsonLine(line, lineKey);
    // Render an empty line as a non-collapsing block so breaks are preserved.
    return <div key={lineKey}>{line.length === 0 ? "​" : nodes}</div>;
  });
};

const EnvironmentConfiguration = ({ environment, onEnvironmentUpdate }) => {
  const { success, error: showError } = useToast();
  const [format, setFormat] = useState("json");
  const [showSshKey, setShowSshKey] = useState(false);
  const [showSshKeyEditor, setShowSshKeyEditor] = useState(false);
  const [newSshKey, setNewSshKey] = useState("");
  const [isSavingSshKey, setIsSavingSshKey] = useState(false);

  const generateConfiguration = () => {
    const config = {
      id: environment.id,
      name: environment.name,
      globalPrefix: environment.global_prefix || environment.globalPrefix || "",
      provider: environment.provider,
      region: environment.region,
      location: environment.location || environment.region,
      status: environment.status,
      backend: environment.terraform_backend?.enabled || false,
      services: environment.services || {},
      createdAt:
        environment.createdAt ||
        environment.created_at ||
        new Date().toISOString(),
      updatedAt:
        environment.updatedAt ||
        environment.updated_at ||
        new Date().toISOString(),
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
      // Add argocd object for Injecto compatibility
      config.argocd = {
        git_repo_url: environment.git_repository.url || "",
        targetRevision: environment.git_repository.branch || "HEAD",
        git_target_revision: environment.git_repository.branch || "HEAD",
      };
    }

    if (environment.helmCharts) {
      config.helmCharts = environment.helmCharts;
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

  const handleRotateSshKey = async () => {
    if (!newSshKey.trim()) {
      showError("Please enter an SSH private key");
      return;
    }

    try {
      setIsSavingSshKey(true);
      const updated = await authService.put(`/environments/${environment.id}`, {
        ...environment,
        gitRepository: {
          ...environment.git_repository,
          sshKey: newSshKey.trim(),
        },
      });
      onEnvironmentUpdate?.(updated);
      setShowSshKeyEditor(false);
      setNewSshKey("");
      success("SSH key updated successfully");
    } catch (err) {
      console.error("Failed to update SSH key:", err);
      showError(err.message || "Failed to update SSH key");
    } finally {
      setIsSavingSshKey(false);
    }
  };

  const content = getFormattedContent();

  return (
    <div className="space-y-6">
      {/* Terraform Backend Configuration */}
      {environment.terraform_backend?.enabled && (
        <div className="p-6 rounded-2xl border bg-surface border-border">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 mr-2 text-accent" />
            <h4 className="text-base font-bold text-primary">
              Terraform Backend Configuration
            </h4>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {environment.terraform_backend.bucketName && (
                <div>
                  <p className="section-label mb-1">S3 Bucket</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono text-primary">
                      {environment.terraform_backend.bucketName}
                    </p>
                    <a
                      href={`https://${environment.region}.console.aws.amazon.com/s3/buckets/${environment.terraform_backend.bucketName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary"
                      title="Open in AWS Console"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p className="section-label mb-1">Locking Mechanism</p>
                <p className="text-sm text-primary">
                  {environment.terraform_backend.lockingMechanism === "s3"
                    ? "S3 Native Locking"
                    : "DynamoDB"}
                </p>
              </div>
              {environment.terraform_backend.lockingMechanism === "dynamodb" &&
                environment.terraform_backend.tableName && (
                  <div>
                    <p className="section-label mb-1">DynamoDB Table</p>
                    <p className="text-sm font-mono text-primary">
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
        <div className="p-6 rounded-2xl border bg-surface border-border">
          <div className="flex items-center mb-4">
            <GitBranch className="w-5 h-5 mr-2 text-accent" />
            <h4 className="text-base font-bold text-primary">
              Git Repository Configuration
            </h4>
          </div>
          <div className="space-y-4">
            <div>
              <p className="section-label mb-1">Repository URL</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-mono text-primary">
                  {environment.git_repository.url}
                </p>
                {environment.git_repository.url.includes("github.com") && (
                  <a
                    href={environment.git_repository.url
                      .replace("git@github.com:", "https://github.com/")
                      .replace(".git", "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="section-label mb-2">SSH Private Key</p>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-background border border-border">
                <Key className="w-4 h-4 text-primary shrink-0" />
                <p
                  className={`text-xs font-mono flex-1 text-secondary ${
                    showSshKey ? "break-all" : ""
                  }`}
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
                    className="p-1 rounded transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
                    title={showSshKey ? "Hide key" : "Show key"}
                  >
                    {showSshKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowSshKeyEditor(true)}
                className="mt-2 flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Rotate SSH Key</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary">
          Environment Configuration
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setFormat("json")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === "json"
                  ? "bg-primary-muted text-primary"
                  : "bg-background-secondary text-secondary hover:bg-surface-elevated"
              }`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              JSON
            </button>
            <button
              onClick={() => setFormat("yaml")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                format === "yaml"
                  ? "bg-primary-muted text-primary"
                  : "bg-background-secondary text-secondary hover:bg-surface-elevated"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              YAML
            </button>
          </div>
          <button onClick={copyToClipboard} className="btn-op-secondary">
            <Copy className="w-4 h-4 inline mr-2" />
            Copy
          </button>
          <button onClick={downloadConfiguration} className="btn-op-secondary">
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-overlay overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border-b border-border">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-tertiary">
            {environment.name}.{format === "yaml" ? "yaml" : "json"}
          </span>
          <span className="ml-auto font-mono text-[10px] text-tertiary">
            {content.split("\n").length} lines
          </span>
        </div>
        <div className="relative">
          <pre className="p-4 text-sm font-mono overflow-auto max-h-96 text-secondary custom-scrollbar">
            <code>{highlightContent(content, format)}</code>
          </pre>
        </div>
      </div>

      <div className="p-4 rounded-lg border-l-4 bg-primary-muted border-primary text-primary">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium mb-1">Configuration Export</p>
            <p className="text-sm opacity-90">
              This configuration represents the complete state of your
              environment including all services, settings, and metadata. You
              can use this to backup, version control, or recreate this
              environment.
            </p>
          </div>
        </div>
      </div>

      {showSshKeyEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSshKeyEditor(false);
              setNewSshKey("");
            }}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl bg-surface border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center space-x-3">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">
                  Rotate SSH Key
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSshKeyEditor(false);
                  setNewSshKey("");
                }}
                className="p-1.5 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-secondary">
                Paste the new SSH private key for{" "}
                <span className="font-mono font-medium">
                  {environment.git_repository?.url
                    ?.replace("git@github.com:", "")
                    .replace("git@gitlab.com:", "")
                    .replace(/\.git$/, "")}
                </span>
              </p>
              <textarea
                value={newSshKey}
                onChange={(e) => setNewSshKey(e.target.value)}
                rows={8}
                placeholder="Paste your SSH private key here..."
                className="w-full px-4 py-3 rounded-lg border font-mono text-xs resize-none transition-colors bg-background border-border text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSshKeyEditor(false);
                    setNewSshKey("");
                  }}
                  className="btn-op-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRotateSshKey}
                  disabled={isSavingSshKey || !newSshKey.trim()}
                  className="btn-op-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSshKey ? "Saving..." : "Update Key"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentConfiguration;
