import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Settings, Package, Cloud } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { validateEnvironmentConfig, getValidationSummary } from '../../../utils/configValidator';
import BasicConfigStep from './BasicConfigStep';
import ServicesConfigStep from './ServicesConfigStep';
import HelmChartsStep from './HelmChartsStep';
import AIChatModal from '../AIChatModal';
import LoadingSpinner from '../../LoadingSpinner';

const WizardContainer = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onClose,
  onCreate,
  onEditHelmValues,
  isEditMode = false,
  isLoading = false
}) => {
  const { isDark } = useTheme();
  const { error } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState([]);
  const [aiChatModal, setAiChatModal] = useState({
    isOpen: false,
    service: null,
    serviceTitle: null,
  });

  const [aiChatMessages, setAiChatMessages] = useState({});

  // Check if kubernetes service is enabled to show step 3
  const hasKubernetesService = () => {
    return newEnv.services?.eks?.enabled ||
           newEnv.services?.aks?.enabled ||
           newEnv.services?.gke?.enabled ||
           newEnv.services?.kubernetes?.enabled;
  };

  const totalSteps = hasKubernetesService() ? 3 : 2;

  const steps = [
    {
      number: 1,
      title: 'Basic Configuration',
      icon: Settings,
      description: 'Environment name and provider'
    },
    {
      number: 2,
      title: 'Services Configuration',
      icon: Cloud,
      description: 'Select and configure services'
    },
    {
      number: 3,
      title: 'Helm Charts',
      icon: Package,
      description: 'Configure Kubernetes applications'
    }
  ];

  // In edit mode, skip step 1 (basic config cannot be modified)
  useEffect(() => {
    if (isEditMode) {
      setCurrentStep(2);
      setCompletedSteps(new Set([1]));
    }
  }, [isEditMode]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (!newEnv) return false;

    try {
      const errors = validateEnvironmentConfig(newEnv);
      const summary = getValidationSummary(errors);
      setValidationErrors(summary.errors);

      switch (currentStep) {
        case 1: // Basic Configuration
          return Boolean(newEnv.name?.trim() && newEnv.type && newEnv.region);

        case 2: // Services Configuration
          // Allow progression even without services for now
          return true;

        case 3: // Helm Charts
          return true; // Helm charts are optional

        default:
          return false;
      }
    } catch (err) {
      console.warn('Validation error:', err);
      setValidationErrors([]);
      // Allow progression if validation fails
      return currentStep === 1 ? Boolean(newEnv.name?.trim() && newEnv.type && newEnv.region) : true;
    }
  }, [newEnv, currentStep]);

  const canGoNext = useMemo(() => validateCurrentStep(), [validateCurrentStep]);

  const handleStepChange = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.has(stepNumber)) {
      setCurrentStep(stepNumber);
    }
  };

  const handleNext = () => {
    if (!canGoNext) {
      if (validationErrors.length > 0) {
        const firstError = validationErrors[0];
        error(`Validation Error: ${firstError.message}`, {
          title: 'Configuration Invalid',
          duration: 5000
        });
      }
      return;
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));

    // Skip step 3 if no kubernetes service is enabled
    if (currentStep === 2 && !hasKubernetesService()) {
      // We're done, create the environment
      onCreate();
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1 && !(isEditMode && currentStep === 2)) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (!canGoNext) {
      if (validationErrors.length > 0) {
        const firstError = validationErrors[0];
        error(`Validation Error: ${firstError.message}`, {
          title: 'Configuration Invalid',
          duration: 5000
        });
      }
      return;
    }

    // Call onCreate without parameters - the parent component already has the newEnv state
    onCreate();
  };

  const handleAskAI = (service, serviceTitle) => {
    setAiChatModal({
      isOpen: true,
      service,
      serviceTitle,
      wizardValues: newEnv
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            validationErrors={validationErrors.filter(e =>
              ['name', 'type', 'region'].includes(e.field)
            )}
          />
        );

      case 2:
        return (
          <ServicesConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            expandedServices={expandedServices}
            setExpandedServices={setExpandedServices}
            onAskAI={handleAskAI}
            validationErrors={validationErrors.filter(e =>
              !['name', 'type', 'region'].includes(e.field)
            )}
          />
        );

      case 3:
        return (
          <HelmChartsStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            onEditHelmValues={onEditHelmValues}
            onAskAI={handleAskAI}
          />
        );

      default:
        return null;
    }
  };

  if (!newEnv) {
    return null;
  }

  return (
    <>
      <div className={`fixed inset-0 ${
        isDark ? 'bg-black/70' : 'bg-black/50'
      } backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
        isLoading ? 'pointer-events-none' : ''
      }`}>
        <div className={`${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-md rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border ${
          isDark ? 'border-gray-700/50' : 'border-gray-200/50'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div>
              <h2 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {isEditMode ? 'Edit Environment' : 'Create New Environment'}
              </h2>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {steps.find(s => s.number === currentStep)?.description || ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content with Steps and Form */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Progress Steps - Compact and consistent */}
              <div className={`mb-4 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'} rounded-lg p-4`}>
                <div className="flex items-center justify-center">
                  <div className="flex items-start space-x-3">
                    {steps.slice(0, totalSteps).map((step, index) => {
                      const isActive = step.number === currentStep;
                      const isCompleted = completedSteps.has(step.number);
                      const isClickable = !isEditMode || step.number > 1;

                      return (
                        <div key={step.number} className="flex items-start">
                          {/* Step Circle and Content */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => isClickable && handleStepChange(step.number)}
                              disabled={!isClickable}
                              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isClickable ? 'cursor-pointer transform hover:scale-105' : 'cursor-not-allowed'
                              } ${
                                isActive
                                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg ring-4 ring-teal-500/30'
                                  : isCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                                  : isDark
                                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <step.icon className="w-5 h-5" />
                              )}
                            </button>
                            <div className="mt-2 text-center min-h-[2.5rem] flex flex-col justify-start">
                              <p className={`text-xs font-medium leading-tight ${
                                isActive
                                  ? (isDark ? 'text-teal-400' : 'text-teal-600')
                                  : isCompleted
                                  ? (isDark ? 'text-green-400' : 'text-green-600')
                                  : (isDark ? 'text-gray-400' : 'text-gray-500')
                              }`}>
                                {step.title}
                              </p>
                              {isEditMode && step.number === 1 && (
                                <div className="text-xs text-orange-500 mt-1 font-medium">Read Only</div>
                              )}
                            </div>
                          </div>

                          {/* Connector line */}
                          {index < totalSteps - 1 && (
                            <div className="flex items-center mx-3 pt-5">
                              <div className={`h-0.5 w-12 transition-colors duration-300 ${
                                isCompleted && (completedSteps.has(steps[index + 1].number) || steps[index + 1].number === currentStep)
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                  : isActive || step.number < currentStep
                                  ? isDark ? 'bg-teal-600' : 'bg-teal-400'
                                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
                              }`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step Content */}
              {renderStepContent()}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className={`flex-shrink-0 flex items-center justify-between p-6 border-t ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || (isEditMode && currentStep === 2)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                currentStep === 1 || (isEditMode && currentStep === 2)
                  ? isDark
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Step Indicator and Progress */}
            <div className="flex items-center space-x-4">
              <div className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Step {currentStep} of {totalSteps}
              </div>

              {/* Progress bar */}
              <div className={`w-32 h-2 rounded-full ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Next/Create Button */}
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext || isLoading}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all font-medium ${
                  !canGoNext || isLoading
                    ? isDark
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {currentStep === 2 && totalSteps === 2
                        ? (isEditMode ? 'Update Environment' : 'Create Environment')
                        : 'Continue'
                      }
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canGoNext || isLoading}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all font-medium ${
                  !canGoNext || isLoading
                    ? isDark
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditMode ? 'Save Changes' : 'Create Environment'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-xl">
              <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl ${
                isDark ? 'border border-gray-700' : 'border border-gray-200'
              }`}>
                <LoadingSpinner />
                <p className={`mt-4 text-center ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {isEditMode ? 'Updating environment...' : 'Creating environment...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Modal */}
      

      {aiChatModal.isOpen && (
        <AIChatModal
          isOpen={aiChatModal.isOpen}
          onClose={() => setAiChatModal({ isOpen: false, service: null, serviceTitle: null })}
          service={aiChatModal.service}
          serviceTitle={aiChatModal.serviceTitle}
          wizardValues={newEnv} 
          setNewEnv={setNewEnv} 
          messages={aiChatMessages[aiChatModal.service] || []}
          setMessages={(update) =>
            setAiChatMessages(prev => {
              const current = prev[aiChatModal.service] || [];
              const newMessages =
                typeof update === "function" ? update(current) : update;
              return { ...prev, [aiChatModal.service]: newMessages };
            })
          }
        />
      )}
    </>
  );
};

export default WizardContainer;
