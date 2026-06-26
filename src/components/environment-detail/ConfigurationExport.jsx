import { useState } from "react";
import { Download, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

const ConfigurationExport = ({ environment }) => {
  const { success } = useToast();
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const generateConfiguration = () => {
    const config = {
      environment: {
        name: environment.name,
        provider: environment.provider,
        region: environment.region,
        status: environment.status,
      },
      services: {},
    };

    // Add enabled services to configuration
    Object.entries(environment.services || {}).forEach(
      ([serviceName, serviceConfig]) => {
        if (serviceConfig?.enabled) {
          config.services[serviceName] = { ...serviceConfig };
        }
      },
    );

    return config;
  };

  const downloadConfiguration = () => {
    const config = generateConfiguration();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${environment.name}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
    success("Configuration downloaded successfully");
  };

  const copyToClipboard = () => {
    const config = generateConfiguration();
    const dataStr = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      success("Configuration copied to clipboard");
    });
  };

  const maskSensitiveValue = (key, value) => {
    const sensitiveKeys = ["password", "secret", "key", "token", "credential"];
    const isSensitive = sensitiveKeys.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey),
    );

    if (isSensitive && !showSensitiveData) {
      return "••••••••";
    }
    return value;
  };

  const renderConfigValue = (key, value, level = 0) => {
    const indent = "  ".repeat(level);

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return (
        <div key={key}>
          <div className="text-primary">
            {indent}&quot;{key}&quot;: {"{"}
          </div>
          {Object.entries(value).map(([subKey, subValue]) =>
            renderConfigValue(subKey, subValue, level + 1),
          )}
          <div className="text-secondary">
            {indent}
            {"}"}
            {level > 0 ? "," : ""}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <div className="text-primary">
            {indent}&quot;{key}&quot;: [
          </div>
          {value.map((item, index) => (
            <div key={index} className="text-success">
              {indent} &quot;{item}&quot;{index < value.length - 1 ? "," : ""}
            </div>
          ))}
          <div className="text-secondary">{indent}],</div>
        </div>
      );
    }

    const displayValue = maskSensitiveValue(key, value);
    const valueColor =
      typeof value === "string" ? "text-success" : "text-warning";

    return (
      <div key={key}>
        <span className="text-primary">
          {indent}&quot;{key}&quot;:
        </span>{" "}
        <span className={valueColor}>
          {typeof value === "string" ? `"${displayValue}"` : displayValue}
        </span>
        <span className="text-secondary">,</span>
      </div>
    );
  };

  const config = generateConfiguration();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          Configuration Export
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="px-3 py-1 rounded text-sm transition-colors bg-background-secondary hover:bg-surface-elevated text-secondary"
          >
            {showSensitiveData ? (
              <>
                <EyeOff className="w-4 h-4 inline mr-1" />
                Hide Sensitive
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 inline mr-1" />
                Show Sensitive
              </>
            )}
          </button>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 rounded text-sm transition-colors bg-primary-muted hover:bg-primary-muted text-primary"
          >
            <Copy className="w-4 h-4 inline mr-1" />
            Copy
          </button>
          <button
            onClick={downloadConfiguration}
            className="px-3 py-1 rounded text-sm transition-colors bg-primary-muted hover:bg-primary-muted text-primary"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Download
          </button>
        </div>
      </div>

      <div className="p-4 rounded-lg border font-mono text-sm overflow-auto max-h-96 bg-background border-border text-secondary">
        <div className="text-secondary">{"{"}</div>
        {Object.entries(config).map(([key, value]) =>
          renderConfigValue(key, value, 1),
        )}
        <div className="text-secondary">{"}"}</div>
      </div>
    </div>
  );
};

export default ConfigurationExport;
