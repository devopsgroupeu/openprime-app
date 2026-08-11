import { useState } from "react";
import { Download, Copy, Code, FileText } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

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

const EnvironmentConfiguration = ({ environment }) => {
  const { success } = useToast();
  const [format, setFormat] = useState("json");

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
      // Deliberately field-by-field, not a spread: this file is downloaded and
      // (per the copy below) version-controlled, so it must never gain a secret
      // by inheriting one that is added to git_repository later.
      config.gitRepository = {
        url: environment.git_repository.url || "",
        branch: environment.git_repository.branch || "HEAD",
      };
      // Add argocd object for Injecto compatibility
      config.argocd = {
        git_repo_url: environment.git_repository.url || "",
        targetRevision: environment.git_repository.branch || "HEAD",
        git_target_revision: environment.git_repository.branch || "HEAD",
      };
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

  const content = getFormattedContent();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-extrabold text-primary">
            Environment Configuration
          </h2>
        </div>
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
              This configuration describes your environment&apos;s services,
              settings, and metadata. Credentials and your Git deploy key are
              not included, so recreating an environment from this file means
              re-entering them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentConfiguration;
