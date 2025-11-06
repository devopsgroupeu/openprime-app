// src/components/modals/wizard/BasicConfigStep.js
import React, { useState, useEffect } from 'react';
import { Cloud, MapPin, Type, Key, Database, Loader, CheckCircle, GitBranch } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { PROVIDERS, createEmptyEnvironment } from '../../../config/environmentsConfig';
import { getAllProviders } from '../../../config/providersConfig';
import authService from '../../../services/authService';

const BasicConfigStep = ({ newEnv, setNewEnv, validationErrors = [] }) => {
  const { isDark } = useTheme();
  const toast = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [creatingBackend, setCreatingBackend] = useState(false);
  const [backendCreated, setBackendCreated] = useState(false);
  const [createdBucketName, setCreatedBucketName] = useState(null);

  useEffect(() => {
    if (newEnv.provider) {
      loadCredentials(newEnv.provider);
    }
  }, [newEnv.provider]);

  const loadCredentials = async (provider) => {
    try {
      setLoadingCredentials(true);
      const response = await authService.get(`/cloud-credentials?provider=${provider}`);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setCredentials([]);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors.find(error => error.field === fieldName);
  };

  const handleProviderChange = (providerType) => {
    const emptyEnv = createEmptyEnvironment(providerType);
    setNewEnv({
      ...emptyEnv,
      name: newEnv.name,
      cloudCredentialId: null
    });
    setBackendCreated(false);
    setCreatedBucketName(null);
  };

  const handleCreateBackend = async () => {
    if (!newEnv.cloudCredentialId) {
      toast.error('Please select AWS credentials first');
      return;
    }

    if (!newEnv.name) {
      toast.error('Please enter environment name first');
      return;
    }

    if (newEnv.terraformBackend?.lockingMechanism === 'dynamodb' && !newEnv.terraformBackend?.tableName) {
      toast.error('Please enter DynamoDB table name');
      return;
    }

    setCreatingBackend(true);

    try {
      const response = await authService.post('/environments/terraform-backend/create', {
        region: newEnv.region,
        environmentName: newEnv.name,
        lockingMechanism: newEnv.terraformBackend.lockingMechanism,
        tableName: newEnv.terraformBackend.tableName,
        cloudCredentialId: newEnv.cloudCredentialId
      });

      if (response.success) {
        const bucketName = response.data?.bucketName;
        setBackendCreated(true);
        setCreatedBucketName(bucketName);

        // Update newEnv with the bucket name
        if (bucketName) {
          setNewEnv({
            ...newEnv,
            terraformBackend: {
              ...newEnv.terraformBackend,
              bucketName: bucketName
            }
          });
          toast.success(`Terraform backend created: ${bucketName}`, { duration: 8000 });
        } else {
          toast.success('Terraform backend resources created successfully');
        }
      } else {
        toast.error(response.error || 'Failed to create backend resources');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to create backend resources';
      toast.error(errorMessage);
    } finally {
      setCreatingBackend(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm mb-4 ${
          isDark
            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
            : 'bg-teal-500/10 text-teal-700 border border-teal-500/30'
        }`}>
          <Cloud className="w-4 h-4 mr-2" />
          Basic Configuration
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Let's start with the basics
        </h3>
        <p className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Choose your environment name, cloud provider, and deployment region
        </p>
      </div>

      {/* Environment Name */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <Type className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Environment Name
          </label>
        </div>
        <input
          type="text"
          className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 text-lg ${
            getFieldError('name')
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : isDark
              ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
              : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
          }`}
          placeholder="e.g., Production, Staging, Development"
          value={newEnv.name}
          onChange={(e) => setNewEnv({...newEnv, name: e.target.value})}
        />
        {getFieldError('name') ? (
          <p className="text-red-500 text-xs mt-2">
            {getFieldError('name').message}
          </p>
        ) : (
          <p className={`text-xs mt-2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Choose a descriptive name that identifies the purpose of this environment
          </p>
        )}
      </div>

      {/* Cloud Provider */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <Cloud className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Cloud Provider
          </label>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {getAllProviders().map((provider) => (
            <button
              key={provider.value}
              onClick={() => handleProviderChange(provider.value)}
              disabled={!provider.enabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                provider.enabled ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
              } ${
                newEnv.provider === provider.value
                  ? isDark
                    ? 'border-teal-500 bg-teal-500/20 text-white'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : provider.enabled
                  ? isDark
                    ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  : isDark
                  ? 'border-gray-700 bg-gray-800/30 text-gray-500'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  newEnv.provider === provider.value
                    ? 'bg-teal-500 text-white'
                    : provider.enabled
                    ? isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium">{provider.name}</div>
                <div className={`text-xs mt-1 ${
                  provider.enabled
                    ? isDark ? 'text-gray-400' : 'text-gray-500'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {provider.value === 'aws' ? 'Amazon Web Services' :
                   provider.value === 'azure' ? 'Microsoft Azure' :
                   provider.value === 'gcp' ? 'Google Cloud Platform' :
                   'Self-managed'}
                  {!provider.enabled && (
                    <span className="block text-xs mt-1 font-medium text-orange-500">
                      Disabled
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cloud Credentials Selection */}
      {newEnv.provider && (
        <div className={`p-6 rounded-xl border ${
          isDark
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white/70 border-gray-200'
        }`}>
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 mr-2 text-teal-500" />
            <label className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Cloud Credentials (Optional)
            </label>
          </div>

          {loadingCredentials ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : credentials.length > 0 ? (
            <div>
              <select
                className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 text-lg ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                value={newEnv.cloudCredentialId || ''}
                onChange={(e) => setNewEnv({...newEnv, cloudCredentialId: e.target.value || null})}
              >
                <option value="">No credentials (manual configuration)</option>
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} - {cred.identifier}
                    {cred.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              <p className={`text-xs mt-2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Select saved credentials to use for this environment
              </p>
            </div>
          ) : (
            <div className={`p-4 rounded-lg border-2 border-dashed text-center ${
              isDark
                ? 'border-gray-600 bg-gray-700/30 text-gray-400'
                : 'border-gray-300 bg-gray-50 text-gray-500'
            }`}>
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-2">No saved credentials found</p>
              <p className="text-xs">
                Add credentials in Settings to use them for deployments
              </p>
            </div>
          )}
        </div>
      )}

      {/* Region Selection */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 mr-2 text-teal-500" />
          <label className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Deployment Region
          </label>
        </div>

        {newEnv.provider && PROVIDERS[newEnv.provider] ? (
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 text-lg ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
              }`}
              value={newEnv.region}
              onChange={(e) => setNewEnv({...newEnv, region: e.target.value})}
            >
              {PROVIDERS[newEnv.provider].regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-2 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Choose the region closest to your users for optimal performance
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg border-2 border-dashed text-center ${
            isDark
              ? 'border-gray-600 bg-gray-700/30 text-gray-400'
              : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}>
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a cloud provider first</p>
          </div>
        )}
      </div>

      {/* Terraform Backend Configuration */}
      {newEnv.provider === 'aws' && (
        <div className={`p-6 rounded-xl border ${
          isDark
            ? 'bg-gray-800/50 border-gray-700'
            : 'bg-white/70 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-teal-500" />
              <label className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Terraform Backend (Optional)
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={newEnv.terraformBackend?.enabled || false}
                onChange={(e) => setNewEnv({
                  ...newEnv,
                  terraformBackend: {
                    ...newEnv.terraformBackend,
                    enabled: e.target.checked,
                    bucketName: newEnv.terraformBackend?.bucketName || '',
                    lockingMechanism: newEnv.terraformBackend?.lockingMechanism || 's3',
                    tableName: newEnv.terraformBackend?.tableName || ''
                  }
                })}
              />
              <div className={`w-11 h-6 rounded-full peer transition-colors ${
                isDark
                  ? 'bg-gray-600 peer-checked:bg-teal-500'
                  : 'bg-gray-300 peer-checked:bg-teal-500'
              }`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                  newEnv.terraformBackend?.enabled ? 'translate-x-5' : ''
                }`}></div>
              </div>
            </label>
          </div>

          <p className={`text-xs mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Automatically create S3 bucket and optional DynamoDB table for Terraform state management
          </p>

          {newEnv.terraformBackend?.enabled && !newEnv.cloudCredentialId && (
            <div className={`p-4 rounded-lg border mb-4 ${
              isDark
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                : 'bg-orange-50 border-orange-200 text-orange-700'
            }`}>
              <div className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  AWS credentials are required to create Terraform backend resources
                </span>
              </div>
              <p className="text-xs mt-1 ml-6">
                Please select cloud credentials above before creating backend resources
              </p>
            </div>
          )}

          {newEnv.terraformBackend?.enabled && (
            <div className="space-y-4 mt-4">
              <div className={`p-4 rounded-lg border ${
                isDark
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <div className="flex items-start">
                  <Database className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">S3 Bucket Name (Auto-generated)</p>
                    <p className="text-xs mt-1">
                      Format: <code className="font-mono">&lt;AWS_ACCOUNT_ID&gt;-terraform-&lt;environment-name&gt;</code>
                    </p>
                    {newEnv.name && credentials.find(c => c.id === newEnv.cloudCredentialId) && (
                      <p className="text-xs mt-1 font-mono">
                        Preview: {credentials.find(c => c.id === newEnv.cloudCredentialId)?.identifier}-terraform-{newEnv.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  State Locking Mechanism
                </label>
                <select
                  className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                  } ${backendCreated || creatingBackend ? 'opacity-60 cursor-not-allowed' : ''}`}
                  value={newEnv.terraformBackend?.lockingMechanism || 's3'}
                  disabled={backendCreated || creatingBackend}
                  onChange={(e) => setNewEnv({
                    ...newEnv,
                    terraformBackend: {
                      ...newEnv.terraformBackend,
                      lockingMechanism: e.target.value
                    }
                  })}
                >
                  <option value="s3">S3 Native Locking (Terraform 1.11+)</option>
                  <option value="dynamodb">DynamoDB Locking</option>
                </select>
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {newEnv.terraformBackend?.lockingMechanism === 's3'
                    ? 'Uses S3 native locking (requires Terraform 1.11 or higher)'
                    : 'Creates DynamoDB table for state locking (works with all Terraform versions)'}
                </p>
              </div>

              {newEnv.terraformBackend?.lockingMechanism === 'dynamodb' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    DynamoDB Table Name
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                    } ${backendCreated || creatingBackend ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder="e.g., terraform-state-lock"
                    value={newEnv.terraformBackend?.tableName || ''}
                    disabled={backendCreated || creatingBackend}
                    onChange={(e) => setNewEnv({
                      ...newEnv,
                      terraformBackend: {
                        ...newEnv.terraformBackend,
                        tableName: e.target.value
                      }
                    })}
                  />
                  <p className={`text-xs mt-1 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    DynamoDB table for managing Terraform state locks
                  </p>
                </div>
              )}

              {/* Create Backend Button */}
              {backendCreated ? (
                <div className={`p-4 rounded-lg border ${
                  isDark
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Backend resources created successfully</p>
                      {createdBucketName && (
                        <p className="text-xs mt-1 font-mono opacity-90">
                          S3 Bucket: {createdBucketName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleCreateBackend}
                  disabled={!newEnv.cloudCredentialId || creatingBackend}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    !newEnv.cloudCredentialId || creatingBackend
                      ? isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isDark
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  {creatingBackend ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Creating Backend Resources...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 mr-2" />
                      Create Backend Resources
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Git Repository Configuration */}
      <div className={`p-6 rounded-xl border ${
        isDark
          ? 'bg-gray-800/50 border-gray-700'
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-teal-500" />
            <label className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Git Repository (Optional)
            </label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={newEnv.gitRepository?.enabled || false}
              onChange={(e) => setNewEnv({
                ...newEnv,
                gitRepository: {
                  ...newEnv.gitRepository,
                  enabled: e.target.checked,
                  url: newEnv.gitRepository?.url || '',
                  sshKey: newEnv.gitRepository?.sshKey || ''
                }
              })}
            />
            <div className={`w-11 h-6 rounded-full peer transition-colors ${
              isDark
                ? 'bg-gray-600 peer-checked:bg-teal-500'
                : 'bg-gray-300 peer-checked:bg-teal-500'
            }`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                newEnv.gitRepository?.enabled ? 'translate-x-5' : ''
              }`}></div>
            </div>
          </label>
        </div>

        <p className={`text-xs mb-4 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Configure Git repository for infrastructure code storage and version control
        </p>

        {newEnv.gitRepository?.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Repository URL
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                placeholder="git@github.com:organization/repository.git"
                value={newEnv.gitRepository?.url || ''}
                onChange={(e) => setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    url: e.target.value
                  }
                })}
              />
              <p className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                SSH URL of the Git repository for infrastructure code
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                SSH Private Key (Deploy Key)
              </label>
              <textarea
                className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 font-mono text-xs ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500/20'
                }`}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                rows={8}
                value={newEnv.gitRepository?.sshKey || ''}
                onChange={(e) => setNewEnv({
                  ...newEnv,
                  gitRepository: {
                    ...newEnv.gitRepository,
                    sshKey: e.target.value
                  }
                })}
              />
              <p className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Private SSH key with read access to the repository
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {newEnv.name && newEnv.provider && newEnv.region && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">
              Ready to create "{newEnv.name}" on {PROVIDERS[newEnv.provider]?.name} in {PROVIDERS[newEnv.provider]?.regions.find(r => r.value === newEnv.region)?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicConfigStep;
