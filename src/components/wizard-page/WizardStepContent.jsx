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
        />
      );
    case "helm":
      return (
        <HelmChartsStep
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          onEditHelmValues={onEditHelmValues}
          onAskAI={onAskAI}
        />
      );
    case "review":
      return (
        <WizardReviewStep
          newEnv={newEnv}
          onEditStep={onEditStep}
          problems={basicErrors}
          // Only errors that name an enabled service (the cross-service
          // rules). Field-level service checks carry no service name and
          // flag every environment today: disabled services are validated
          // too, and numeric dropdowns are stored as strings.
          serviceProblems={validationErrors.filter(
            (e) => newEnv.services?.[e.field]?.enabled,
          )}
        />
      );
    default:
      return null;
  }
};

export default WizardStepContent;
