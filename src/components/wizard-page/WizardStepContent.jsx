import BasicConfigStep from "../modals/wizard/BasicConfigStep";
import ServicesConfigStep from "../modals/wizard/ServicesConfigStep";
import HelmChartsStep from "../modals/wizard/HelmChartsStep";
import WizardReviewStep from "../WizardReviewStep";

// Renders the active wizard step. Extracted from WizardPage.renderStepContent;
// all state/handlers are owned by WizardPage and passed through.
const WizardStepContent = ({
  currentId,
  newEnv,
  setNewEnv,
  expandedServices,
  setExpandedServices,
  onAskAI,
  showErrors,
  validationErrors,
  basicErrors,
  onEditHelmValues,
  onEditStep,
  focusHeading,
  isEditMode,
  sshKeys,
}) => {
  switch (currentId) {
    case "basic":
      return (
        <BasicConfigStep
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          isEditMode={isEditMode}
          validationErrors={showErrors ? basicErrors : []}
          sshKeys={sshKeys}
        />
      );
    case "services":
      return (
        <ServicesConfigStep
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          expandedServices={expandedServices}
          setExpandedServices={setExpandedServices}
          onAskAI={onAskAI}
          focusHeading={focusHeading}
        />
      );
    case "helm":
      return (
        <HelmChartsStep
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          onEditHelmValues={onEditHelmValues}
          onAskAI={onAskAI}
          focusHeading={focusHeading}
        />
      );
    case "review":
      return (
        <WizardReviewStep
          newEnv={newEnv}
          onEditStep={onEditStep}
          problems={basicErrors}
          // Every error of an enabled service (the validator skips disabled
          // ones and names the service in the message).
          serviceProblems={validationErrors.filter((e) => e.service)}
        />
      );
    default:
      return null;
  }
};

export default WizardStepContent;
