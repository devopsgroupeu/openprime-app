import React from "react";
import { X, ChevronLeft, ChevronRight, Check, Settings, Package, Cloud } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const WizardNavigation = ({
  currentStep,
  totalSteps,
  completedSteps,
  onStepChange,
  onClose,
  onPrevious,
  onNext,
  onFinish,
  canGoNext,
  isEditMode,
  isLoading,
  newEnv,
}) => {
  const { isDark } = useTheme();

  const steps = [
    {
      number: 1,
      title: "Basic Configuration",
      icon: Settings,
      description: "Environment name and provider",
    },
    {
      number: 2,
      title: "Services Configuration",
      icon: Cloud,
      description: "Select and configure services",
    },
    {
      number: 3,
      title: "Helm Charts",
      icon: Package,
      description: "Configure Kubernetes applications",
    },
  ];

  const getStepStatus = (stepNumber) => {
    if (completedSteps.has(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    if (stepNumber < currentStep) return "completed";
    return "upcoming";
  };

  return (
    <>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-6 border-b ${
          isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50/50"
        }`}
      >
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {isEditMode ? "Edit Environment" : "Create New Environment"}
          </h2>
          <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {isEditMode ? `Editing "${newEnv.name}"` : "Configure your infrastructure environment"}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark
              ? "hover:bg-gray-700 text-gray-400 hover:text-white"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Step Indicator */}
      <div
        className={`shrink-0 px-6 py-6 border-b ${
          isDark ? "border-gray-700 bg-gray-800/20" : "border-gray-200 bg-gray-50/30"
        }`}
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            {steps.slice(0, totalSteps).map((step, index) => {
              const status = getStepStatus(step.number);
              const isClickable = !isEditMode || step.number > 1;

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => isClickable && onStepChange(step.number)}
                      disabled={!isClickable}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isClickable
                          ? "cursor-pointer transform hover:scale-105"
                          : "cursor-not-allowed"
                      } ${
                        status === "current"
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg ring-4 ring-teal-500/30"
                          : status === "completed"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                            : isDark
                              ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {status === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </button>
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm font-medium ${
                          status === "current"
                            ? isDark
                              ? "text-teal-400"
                              : "text-teal-600"
                            : status === "completed"
                              ? isDark
                                ? "text-green-400"
                                : "text-green-600"
                              : isDark
                                ? "text-gray-400"
                                : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {index < totalSteps - 1 && (
                    <div
                      className={`flex-1 h-1 mx-6 rounded-full ${
                        step.number < currentStep || completedSteps.has(step.number + 1)
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500"
                          : isDark
                            ? "bg-gray-700"
                            : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div
        className={`flex items-center justify-between p-6 border-t ${
          isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50/50"
        }`}
      >
        <button
          onClick={onPrevious}
          disabled={currentStep === 1 || (isEditMode && currentStep === 2)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 1 || (isEditMode && currentStep === 2)
              ? "opacity-50 cursor-not-allowed"
              : isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Step {currentStep} of {totalSteps}
        </div>

        {currentStep < totalSteps ? (
          <button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
              !canGoNext || isLoading ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isDark
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Next</span>
            )}
            {!isLoading && <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={onFinish}
            disabled={!canGoNext || isLoading}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
              !canGoNext || isLoading ? "opacity-50 cursor-not-allowed" : ""
            } ${
              isDark
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? "Save Changes" : "Create Environment"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default WizardNavigation;
