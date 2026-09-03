import { ChevronLeft, ChevronRight, Check } from "lucide-react";

// Sticky footer of the environment wizard: back/cancel, step counter, next/create.
// Presentational — navigation handlers live in WizardPage.
const WizardFooter = ({
  currentStep,
  totalSteps,
  progressPercent,
  isEditMode,
  isLoading,
  canGoNext,
  onCancel,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <div className="sticky bottom-0 z-20 shrink-0 flex items-center justify-between border-t border-border bg-surface px-8 py-4">
      <button
        onClick={() => (currentStep === 1 ? onCancel() : onPrevious())}
        className="btn-op-secondary"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{currentStep === 1 ? "Cancel" : "Previous"}</span>
      </button>

      <div className="hidden items-center gap-4 sm:flex">
        <span className="section-label">
          Step {currentStep} of {totalSteps}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="progress-glow h-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <button
        onClick={currentStep < totalSteps ? onNext : onSubmit}
        disabled={!canGoNext || isLoading}
        className="btn-op-primary"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : currentStep < totalSteps ? (
          <>
            <span>Continue</span>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            <span>{isEditMode ? "Save Changes" : "Create Environment"}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default WizardFooter;
