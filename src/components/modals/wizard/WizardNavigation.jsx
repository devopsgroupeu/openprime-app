import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
  Package,
  Cloud,
} from "lucide-react";

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
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            {isEditMode ? "Edit Environment" : "Create New Environment"}
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {isEditMode
              ? `Editing "${newEnv.name}"`
              : "Configure your infrastructure environment"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors text-tertiary hover:text-primary hover:bg-surface-elevated"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="shrink-0 px-6 py-6 border-b border-border bg-surface">
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
                          ? "bg-primary text-inverse shadow-lg ring-4 ring-primary-muted"
                          : status === "completed"
                            ? "bg-success text-inverse shadow-md"
                            : "bg-background-secondary text-tertiary hover:bg-surface-elevated"
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
                            ? "text-primary"
                            : status === "completed"
                              ? "text-success"
                              : "text-tertiary"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs mt-1 text-tertiary">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {index < totalSteps - 1 && (
                    <div
                      className={`flex-1 h-1 mx-6 rounded-full ${
                        step.number < currentStep ||
                        completedSteps.has(step.number + 1)
                          ? "bg-primary"
                          : "bg-background-secondary"
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
      <div className="flex items-center justify-between p-6 border-t border-border bg-surface">
        <button
          onClick={onPrevious}
          disabled={currentStep === 1 || (isEditMode && currentStep === 2)}
          className="btn-op-secondary space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-sm text-tertiary">
          Step {currentStep} of {totalSteps}
        </div>

        {currentStep < totalSteps ? (
          <button
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className="btn-op-primary space-x-2"
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
            className="btn-op-primary space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {isEditMode ? "Save Changes" : "Create Environment"}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default WizardNavigation;
