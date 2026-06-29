import { useState, useEffect, useRef } from "react";
import { X, Key, Eye, EyeOff } from "lucide-react";

const CloudCredentialModal = ({
  credential,
  provider,
  onClose,
  onSave,
  isOpen,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    accessKey: "",
    secretKey: "",
    isDefault: false,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [errors, setErrors] = useState({});
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name || "",
        identifier: credential.identifier || "",
        accessKey: credential.credentials?.accessKey || "",
        secretKey: credential.credentials?.secretKey || "",
        isDefault: credential.isDefault || false,
      });
    } else {
      setFormData({
        name: "",
        identifier: "",
        accessKey: "",
        secretKey: "",
        isDefault: false,
      });
    }
  }, [credential]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Initial focus on the close button
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Account ID is required";
    }

    if (!credential && !formData.accessKey.trim()) {
      newErrors.accessKey = "Access Key is required";
    }

    if (!credential && !formData.secretKey.trim()) {
      newErrors.secretKey = "Secret Key is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const credentialData = {
      provider: provider,
      name: formData.name,
      identifier: formData.identifier,
      isDefault: formData.isDefault,
      credentials: {
        accessKey: formData.accessKey,
        secretKey: formData.secretKey,
      },
    };

    onSave(credentialData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cloud credential"
        className="w-full max-w-md mx-4 rounded-2xl border border-border bg-surface shadow-xl transition-colors"
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center text-primary transition-colors">
            <Key className="w-6 h-6 text-accent mr-2" />
            {credential ? "Edit" : "Add"} AWS Credentials
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary transition-colors">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background border-border text-primary transition-colors ${
                errors.name ? "border-danger" : ""
              }`}
              placeholder="e.g., Production Account"
            />
            {errors.name && (
              <p className="text-danger text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary transition-colors">
              AWS Account ID
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => handleChange("identifier", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background border-border text-primary transition-colors ${
                errors.identifier ? "border-danger" : ""
              }`}
              placeholder="123456789012"
            />
            {errors.identifier && (
              <p className="text-danger text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary transition-colors">
              Access Key
            </label>
            <input
              type="text"
              value={formData.accessKey}
              onChange={(e) => handleChange("accessKey", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border bg-background border-border text-primary transition-colors ${
                errors.accessKey ? "border-danger" : ""
              }`}
              placeholder={
                credential ? "••••••••••••••••" : "AKIAIOSFODNN7EXAMPLE"
              }
            />
            {errors.accessKey && (
              <p className="text-danger text-sm mt-1">{errors.accessKey}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-secondary transition-colors">
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={formData.secretKey}
                onChange={(e) => handleChange("secretKey", e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border bg-background border-border text-primary transition-colors ${
                  errors.secretKey ? "border-danger" : ""
                }`}
                placeholder={
                  credential
                    ? "••••••••••••••••"
                    : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                }
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-tertiary hover:text-primary"
              >
                {showSecretKey ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.secretKey && (
              <p className="text-danger text-sm mt-1">{errors.secretKey}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => handleChange("isDefault", e.target.checked)}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label
              htmlFor="isDefault"
              className="ml-2 text-sm text-secondary transition-colors"
            >
              Set as default credentials
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-op-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-op-primary flex-1">
              {credential ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloudCredentialModal;
