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
  onEditHelmValues,
  onEditStep,
  isEditMode,
}) => {
  switch (currentId) {
    case "basic":
      return (
        <BasicConfigStep
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          isEditMode={isEditMode}
          validationErrors={
            showErrors
              ? validationErrors.filter((e) =>
                  ["name", "provider", "region"].includes(e.field),
                )
              : []
          }
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
          validationErrors={
            showErrors
              ? validationErrors.filter(
                  (e) => !["name", "provider", "region"].includes(e.field),
                )
              : []
          }
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
      return <WizardReviewStep newEnv={newEnv} onEditStep={onEditStep} />;
    default:
      return null;
  }
};

export default WizardStepContent;
