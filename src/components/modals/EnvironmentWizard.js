// src/components/modals/EnvironmentWizard.js
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Settings, Package, Cloud } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import BasicConfigStep from './wizard/BasicConfigStep';
import ServicesConfigStep from './wizard/ServicesConfigStep';
import HelmChartsStep from './wizard/HelmChartsStep';

const EnvironmentWizard = ({
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onClose,
  onCreate,
  onEditHelmValues,
  isEditMode = false
}) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Check if kubernetes service is enabled to show step 3
  const hasKubernetesService = () => {
    return newEnv.services?.eks?.enabled ||
           newEnv.services?.aks?.enabled ||
           newEnv.services?.gke?.enabled ||
           newEnv.services?.kubernetes?.enabled;
  };

  const totalSteps = hasKubernetesService() ? 3 : 2;

  // In edit mode, skip step 1 (basic config cannot be modified)
  useEffect(() => {
    if (isEditMode) {
      setCurrentStep(2);
      setCompletedSteps(new Set([1]));
    }
  }, [isEditMode]);

  const steps = [
    {
      number: 1,
      title: 'Basic Configuration',
      description: 'Environment name, provider, and region',
      icon: Cloud,
      disabled: isEditMode
    },
    {
      number: 2,
      title: 'Services Configuration',
      description: 'Configure cloud services and infrastructure',
      icon: Settings,
      disabled: false
    },
    {
      number: 3,
      title: 'Helm Charts',
      description: 'Select and configure Kubernetes applications',
      icon: Package,
      disabled: !hasKubernetesService(),
      conditional: true
    }
  ];

  const isStepValid = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return newEnv.name && newEnv.type && newEnv.region;
      case 2:
        return true; // Services are optional
      case 3:
        return true; // Helm charts are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      // Skip step 3 if no kubernetes service is enabled
      if (currentStep === 2 && !hasKubernetesService()) {
        // We're done, create the environment
        onCreate();
        return;
      }

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step completed
        onCreate();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      // In edit mode, don't go back to step 1 (basic config cannot be modified)
      if (isEditMode && currentStep === 2) {
        return;
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepNumber) => {
    // Can't navigate to step 1 in edit mode
    if (isEditMode && stepNumber === 1) {
      return;
    }

    // During creation, allow navigation to any step that's been validated or is current
    // During edit, allow navigation to steps 2 and 3
    if (isEditMode) {
      if (stepNumber >= 2) {
        setCurrentStep(stepNumber);
      }
    } else {
      // In creation mode, allow going back to any previous step or forward if valid
      if (stepNumber <= currentStep || (stepNumber === currentStep + 1 && isStepValid(currentStep))) {
        setCurrentStep(stepNumber);
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
          />
        );
      case 2:
        return (
          <ServicesConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            expandedServices={expandedServices}
            setExpandedServices={setExpandedServices}
            onEditHelmValues={onEditHelmValues}
          />
        );
      case 3:
        return (
          <HelmChartsStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            onEditHelmValues={onEditHelmValues}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
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
              {steps.find(s => s.number === currentStep)?.description}
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

        {/* Progress Steps */}
        <div className={`flex-shrink-0 px-6 py-6 border-b ${
          isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                if (step.conditional && !hasKubernetesService()) {
                  return null;
                }

                const isActive = step.number === currentStep;
                const isCompleted = completedSteps.has(step.number);
                const isPast = step.number < currentStep;
                const isClickable = !step.disabled && (
                  isEditMode ? step.number >= 2 :
                  step.number <= currentStep || (step.number === currentStep + 1 && isStepValid(currentStep))
                );

                return (
                  <div key={step.number} className="flex items-center">
                    {/* Step Circle and Content */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleStepClick(step.number)}
                        disabled={!isClickable}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isClickable ? 'cursor-pointer transform hover:scale-105' : 'cursor-not-allowed'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg ring-4 ring-teal-500/30'
                            : isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                            : step.disabled
                            ? isDark
                              ? 'bg-gray-700 text-gray-500 border-2 border-gray-600'
                              : 'bg-gray-200 text-gray-400 border-2 border-gray-300'
                            : isDark
                            ? 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                            : 'bg-white text-gray-500 border-2 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -inset-1 rounded-full border-2 border-teal-400 animate-pulse"></div>
                        )}
                      </button>

                      {/* Step Title */}
                      <div className="mt-3 text-center">
                        <div className={`text-sm font-medium ${
                          isActive
                            ? isDark ? 'text-white' : 'text-gray-900'
                            : isCompleted
                            ? isDark ? 'text-emerald-300' : 'text-emerald-600'
                            : step.disabled
                            ? isDark ? 'text-gray-500' : 'text-gray-400'
                            : isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </div>

                        {/* Step Number */}
                        <div className={`text-xs mt-1 ${
                          isActive
                            ? isDark ? 'text-teal-300' : 'text-teal-600'
                            : isCompleted
                            ? isDark ? 'text-emerald-400' : 'text-emerald-500'
                            : isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          Step {step.number}
                        </div>

                        {/* Special indicators */}
                        {step.disabled && isEditMode && step.number === 1 && (
                          <div className="text-xs text-orange-500 mt-1 font-medium">Read Only</div>
                        )}
                        {step.conditional && (
                          <div className={`text-xs mt-1 ${
                            isDark ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            Optional
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (!steps[index + 1].conditional || hasKubernetesService()) && (
                      <div className="flex items-center mx-4">
                        <div className={`h-0.5 w-16 transition-colors duration-300 ${
                          isCompleted && (completedSteps.has(steps[index + 1].number) || steps[index + 1].number === currentStep)
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                            : isActive || isPast
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer */}
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

          {/* Step Indicator */}
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
          <button
            onClick={handleNext}
            disabled={!isStepValid(currentStep)}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all font-medium shadow-lg ${
              isStepValid(currentStep)
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 hover:shadow-xl transform hover:scale-105'
                : isDark
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>
              {currentStep === totalSteps
                ? (isEditMode ? 'Update Environment' : 'Create Environment')
                : 'Continue'
              }
            </span>
            {currentStep < totalSteps ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentWizard;
