import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Footer of the wizard's content column: Back, "Step N of M" (beside the
// stepper; without it the compact progress above the h1 says it) and the one
// primary action.
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
  // Until when (Date.now() ms) a click on Create is ignored.
  const createFrom = useRef(0);
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
        <p className="hidden text-sm text-muted-foreground tabular-nums @4xl/wizard:block">
          Step {currentStep} of {totalSteps}
        </p>
        <div className="flex flex-1 justify-end">
          <Button
            onClick={(e) => {
              if (!last) {
                // Continue can turn into Create under the pointer: a click
                // in the next 400 ms is the rest of a double click, not a
                // submit. Keys (detail 0) start no wait.
                if (e.detail > 0) createFrom.current = Date.now() + 400;
                return onNext();
              }
              if (Date.now() >= createFrom.current) onSubmit();
            }}
            disabled={isLoading}
          >
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
