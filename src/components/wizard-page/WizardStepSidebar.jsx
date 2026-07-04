import { Check } from "lucide-react";

// Left sidebar of the environment wizard: clickable step nav + overall progress.
// Presentational — step state and the change handler live in WizardPage.
const WizardStepSidebar = ({
  steps,
  currentStep,
  completedSteps,
  isEditMode,
  progressPercent,
  onStepChange,
}) => {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-surface/40 p-6 sticky top-20 h-[calc(100vh-5rem)]">
      <p className="section-label mb-4">Provisioning Process</p>
      <nav className="space-y-2">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = completedSteps.has(step.number);
          const isClickable = !isEditMode || step.number > 1;
          const StepIcon = step.icon;
          return (
            <button
              key={step.number}
              onClick={() => isClickable && onStepChange(step.number)}
              disabled={!isClickable}
              className={`flex w-full items-start gap-3 rounded-lg border-l-2 p-3 text-left transition-colors ${
                isActive
                  ? "border-primary bg-primary-muted"
                  : "border-transparent hover:bg-surface-elevated"
              } ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-primary text-inverse"
                    : isCompleted
                      ? "bg-success text-inverse"
                      : "bg-surface-elevated text-tertiary"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${isActive ? "accent-teal" : "text-secondary"}`}
                >
                  {step.title}
                </span>
                <span className="block text-xs text-tertiary">
                  {step.description}
                </span>
                {isEditMode && step.number === 1 && (
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-warning">
                    Read only
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-primary/10 bg-primary-muted p-4">
        <div className="mb-2 flex items-end justify-between">
          <span className="section-label">Overall Progress</span>
          <span className="text-xs font-bold accent-teal">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="progress-glow h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </aside>
  );
};

export default WizardStepSidebar;
