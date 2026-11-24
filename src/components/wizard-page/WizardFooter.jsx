import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Footer of the wizard's content column: Back, "Step N of M" (lg and up; the
// compact progress above the h1 shows it below lg) and the one primary action.
// Presentational: navigation and validation live in WizardPage.
const WizardFooter = ({
  currentStep,
  totalSteps,
  isEditMode,
  isLoading,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  const last = currentStep === totalSteps;
  return (
    <footer className="shrink-0 border-t bg-background">
      <div className="mx-auto flex w-full max-w-(--content-settings) items-center gap-3 px-4 py-3 md:px-8">
        <div className="flex flex-1">
          {currentStep > 1 ? (
            <Button variant="secondary" onClick={onPrevious}>
              Back
            </Button>
          ) : null}
        </div>
        <p className="hidden text-sm text-muted-foreground tabular-nums lg:block">
          Step {currentStep} of {totalSteps}
        </p>
        <div className="flex flex-1 justify-end">
          <Button onClick={last ? onSubmit : onNext} disabled={isLoading}>
            {isLoading ? <Spinner aria-hidden /> : null}
            {last
              ? isEditMode
                ? "Save changes"
                : "Create environment"
              : "Continue"}
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default WizardFooter;
