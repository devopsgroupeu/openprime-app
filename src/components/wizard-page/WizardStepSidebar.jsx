import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKER =
  "flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium tabular-nums";

function StepMarker({ step, current, complete }) {
  if (complete && !step.invalid) {
    return (
      <span
        role="img"
        aria-label="Completed"
        className={cn(MARKER, "bg-primary/10 text-primary")}
      >
        <Check className="size-3.5" aria-hidden />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        MARKER,
        current
          ? "text-primary ring-2 ring-primary"
          : "text-muted-foreground ring-1 ring-border",
        step.invalid && "text-destructive ring-destructive",
      )}
    >
      {step.number}
    </span>
  );
}

/**
 * Vertical stepper of the wizard (lg and up). Completed and earlier steps are
 * buttons; the current step carries `aria-current="step"`; later steps are
 * plain text. WizardPage refuses a jump forward to an unvisited step.
 */
const WizardStepSidebar = ({
  steps,
  currentStep,
  completedSteps,
  onStepChange,
}) => (
  <nav
    aria-label="Steps"
    className="hidden w-60 shrink-0 overflow-y-auto border-r px-3 py-6 lg:block"
  >
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const current = step.number === currentStep;
        const complete = !current && completedSteps.has(step.number);
        const reachable = !current && (step.number < currentStep || complete);
        const Row = reachable ? "button" : "div";
        return (
          <li key={step.id} className="relative pb-1">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-9 -bottom-1 left-5 w-px -translate-x-1/2 bg-border"
              />
            ) : null}
            <Row
              {...(reachable
                ? { type: "button", onClick: () => onStepChange(step.number) }
                : {})}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg p-2 text-left",
                reachable &&
                  "transition-[background-color] duration-(--dur-fast) outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              )}
            >
              <StepMarker step={step} current={current} complete={complete} />
              <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <span
                  className={cn(
                    "text-sm",
                    current
                      ? "font-medium text-foreground"
                      : reachable
                        ? "text-foreground/80"
                        : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
                {step.invalid ? (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-destructive"
                    />
                    Needs attention
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </span>
            </Row>
          </li>
        );
      })}
    </ol>
  </nav>
);

/** Below lg the stepper collapses to "Step 2 of 4" and a segmented track. */
export function WizardStepProgress({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between gap-3 lg:hidden">
      <p className="text-xs text-muted-foreground tabular-nums">
        Step {currentStep} of {steps.length}
      </p>
      <ol aria-hidden className="flex gap-1">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "h-1 w-6 rounded-full",
              step.number <= currentStep ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </ol>
    </div>
  );
}

export default WizardStepSidebar;
