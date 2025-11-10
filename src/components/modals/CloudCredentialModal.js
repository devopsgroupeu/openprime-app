import React, { useState, useEffect } from "react";
import { X, Key, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const CloudCredentialModal = ({ credential, provider, onClose, onSave, isOpen }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    accessKey: "",
    secretKey: "",
    isDefault: false,
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [errors, setErrors] = useState({});

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
        className={`w-full max-w-md mx-4 rounded-xl border shadow-xl transition-colors ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-600">
          <h2
            className={`text-xl font-bold flex items-center transition-colors ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <Key className="w-6 h-6 text-primary mr-2" />
            {credential ? "Edit" : "Add"} AWS Credentials
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.name ? "border-red-500" : ""}`}
              placeholder="e.g., Production Account"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              AWS Account ID
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => handleChange("identifier", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.identifier ? "border-red-500" : ""}`}
              placeholder="123456789012"
            />
            {errors.identifier && <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>}
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Access Key
            </label>
            <input
              type="text"
              value={formData.accessKey}
              onChange={(e) => handleChange("accessKey", e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.accessKey ? "border-red-500" : ""}`}
              placeholder={credential ? "••••••••••••••••" : "AKIAIOSFODNN7EXAMPLE"}
            />
            {errors.accessKey && <p className="text-red-500 text-sm mt-1">{errors.accessKey}</p>}
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={formData.secretKey}
                onChange={(e) => handleChange("secretKey", e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.secretKey ? "border-red-500" : ""}`}
                placeholder={
                  credential ? "••••••••••••••••" : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                }
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                  isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {showSecretKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.secretKey && <p className="text-red-500 text-sm mt-1">{errors.secretKey}</p>}
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
              className={`ml-2 text-sm transition-colors ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Set as default credentials
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-700 hover:to-cyan-700 transition-colors"
            >
              {credential ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloudCredentialModal;
