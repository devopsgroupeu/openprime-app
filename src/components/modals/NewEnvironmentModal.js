// src/components/modals/NewEnvironmentModal.js
import React from 'react';
import { PROVIDERS, createEmptyEnvironment } from '../../config/environmentsConfig';
import AwsServicesGrid from './AwsServicesGrid';
import AzureServicesGrid from './AzureServicesGrid';

const NewEnvironmentModal = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onClose,
  onCreate,
  onEditHelmValues,
  isEditMode = false
}) => {
  const addECRRepository = () => {
    const newRepo = { name: '', scanOnPush: true, mutability: 'MUTABLE' };
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        ecr: {
          ...newEnv.services.ecr,
          repositories: [...(newEnv.services.ecr.repositories || []), newRepo]
        }
      }
    });
  };

  const removeECRRepository = (index) => {
    const repos = [...newEnv.services.ecr.repositories];
    repos.splice(index, 1);
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        ecr: { ...newEnv.services.ecr, repositories: repos }
      }
    });
  };

  const addS3Bucket = () => {
    const newBucket = {
      name: '',
      versioning: true,
      encryption: 'AES256',
      publicAccess: false,
      lifecycleRules: false,
      cors: false,
      replication: false
    };
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        s3: {
          ...newEnv.services.s3,
          buckets: [...(newEnv.services.s3.buckets || []), newBucket]
        }
      }
    });
  };

  const removeS3Bucket = (index) => {
    const buckets = [...newEnv.services.s3.buckets];
    buckets.splice(index, 1);
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        s3: { ...newEnv.services.s3, buckets }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEditMode ? 'Edit Environment' : 'Create New Environment'}
        </h2>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Environment Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g., Staging"
                value={newEnv.name}
                onChange={(e) => setNewEnv({...newEnv, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cloud Provider</label>
              <select
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                value={newEnv.type}
                onChange={(e) => {
                  const providerType = e.target.value;
                  const emptyEnv = createEmptyEnvironment(providerType);
                  setNewEnv({
                    ...emptyEnv,
                    name: newEnv.name // Preserve the environment name
                  });
                }}
              >
                {Object.entries(PROVIDERS).map(([key, provider]) => (
                  <option key={key} value={key}>{provider.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Region</label>
              <select
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                value={newEnv.region}
                onChange={(e) => setNewEnv({...newEnv, region: e.target.value})}
              >
                {PROVIDERS[newEnv.type]?.regions.map((region) => (
                  <option key={region.value} value={region.value}>{region.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cloud Services */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {newEnv.type === 'azure' ? 'Azure Services' : 'AWS Services'}
            </label>
            {newEnv.type === 'azure' ? (
              <AzureServicesGrid
                newEnv={newEnv}
                setNewEnv={setNewEnv}
                expandedServices={expandedServices}
                setExpandedServices={setExpandedServices}
                onEditHelmValues={onEditHelmValues}
              />
            ) : (
              <AwsServicesGrid
                newEnv={newEnv}
                setNewEnv={setNewEnv}
                expandedServices={expandedServices}
                setExpandedServices={setExpandedServices}
                onEditHelmValues={onEditHelmValues}
                addECRRepository={addECRRepository}
                removeECRRepository={removeECRRepository}
                addS3Bucket={addS3Bucket}
                removeS3Bucket={removeS3Bucket}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {isEditMode ? 'Update Environment' : 'Create Environment'}
          </button>
        </div>
      </div>
    </div>
  );
};





export default NewEnvironmentModal;
