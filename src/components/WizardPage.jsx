// src/components/WizardPage.jsx
// Full-page environment wizard (replaces the former modal). InfraFlow 3-column layout:
// WizardSidebar (steps + progress) | step form | live code-preview panel.
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckCircle } from "lucide-react";
import AppHeader from "./layout/AppHeader";
import WizardAssistant from "./WizardAssistant";
import AIChatModal from "./modals/AIChatModal";
import HelmValuesModal from "./modals/HelmValuesModal";
import WizardStepSidebar from "./wizard-page/WizardStepSidebar";
import WizardFooter from "./wizard-page/WizardFooter";
import WizardStepContent from "./wizard-page/WizardStepContent";
import { STEP_DEFS } from "./wizard-page/stepDefs";
import { createEmptyEnvironment } from "../config/environmentsConfig";
import {
  validateEnvironmentConfig,
  getValidationSummary,
} from "../utils/configValidator";
import authService from "../services/authService";
import { normalizeEnvironment } from "../utils/environmentShape";
import { useToast } from "../contexts/ToastContext";

const DRAFT_KEY = "op-wizard-draft";

const WizardPage = ({ onCreateEnvironment, onUpdateEnvironment }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [newEnv, setNewEnv] = useState(() => {
    if (isEditMode) return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore unreadable draft */
    }
    return createEmptyEnvironment("aws");
  });
  const [savedAt, setSavedAt] = useState(null);
  const [expandedServices, setExpandedServices] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [validationErrors, setValidationErrors] = useState([]);
  // Errors stay hidden until the user actually tries to advance a step.
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiChatModal, setAiChatModal] = useState({
    isOpen: false,
    service: null,
    serviceTitle: null,
  });
  const [aiChatMessages, setAiChatMessages] = useState({});
  const [valuesEditor, setValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState("");

  // Always land at the top when opening the wizard or switching steps.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentStep]);

  // Load environment for edit mode; step 1 (basic config) is read-only when editing.
  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    (async () => {
      try {
        const env = await authService.get(`/environments/${id}`);
        if (!active) return;
        // The API answers in snake_case; the wizard reads camelCase.
        setNewEnv(normalizeEnvironment(env));
        setCurrentStep(2);
        setCompletedSteps(new Set([1]));
      } catch (err) {
        error(`Failed to load environment: ${err.message}`, {
          title: "Error",
          duration: 6000,
        });
        navigate("/environments");
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEditMode]);

  // Persist the in-progress draft (create mode only) so a refresh or navigation
  // away doesn't lose the configuration. Cleared on successful create.
  useEffect(() => {
    if (isEditMode || !newEnv) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(newEnv));
      setSavedAt(Date.now());
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [newEnv, isEditMode]);

  const hasKubernetesService = () =>
    newEnv?.services?.eks?.enabled ||
    newEnv?.services?.aks?.enabled ||
    newEnv?.services?.gke?.enabled ||
    newEnv?.services?.kubernetes?.enabled;

  const hasK8s = Boolean(hasKubernetesService());
  const activeIds = useMemo(
    () => ["basic", "services", ...(hasK8s ? ["helm"] : []), "review"],
    [hasK8s],
  );
  const steps = activeIds.map((id, i) => ({ ...STEP_DEFS[id], number: i + 1 }));
  const totalSteps = steps.length;
  const currentId = activeIds[currentStep - 1] || "basic";

  const validateCurrentStep = useCallback(() => {
    if (!newEnv) return false;
    try {
      const errors = validateEnvironmentConfig(newEnv);
      setValidationErrors(getValidationSummary(errors).errors);
      switch (currentId) {
        case "basic":
          return Boolean(
            newEnv.name?.trim() &&
            newEnv.globalPrefix?.trim() &&
            newEnv.provider &&
            newEnv.region,
          );
        default:
          return true;
      }
    } catch {
      setValidationErrors([]);
      return currentId === "basic"
        ? Boolean(
            newEnv.name?.trim() &&
            newEnv.globalPrefix?.trim() &&
            newEnv.provider &&
            newEnv.region,
          )
        : true;
    }
  }, [newEnv, currentId]);

  const canGoNext = useMemo(() => validateCurrentStep(), [validateCurrentStep]);

  const handleStepChange = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.has(stepNumber)) {
      setShowErrors(false);
      setCurrentStep(stepNumber);
    }
  };

  const submit = async () => {
    if (!newEnv?.name || !newEnv?.globalPrefix) {
      error("Please enter an environment name and global prefix", {
        title: "Validation Error",
        duration: 5000,
      });
      return;
    }
    setIsLoading(true);
    try {
      if (isEditMode) {
        await onUpdateEnvironment({ ...newEnv });
        success(`Environment "${newEnv.name}" updated successfully`, {
          title: "Environment Updated",
          duration: 4000,
        });
        navigate(`/environments/${id}`);
      } else {
        const config = {
          name: newEnv.name,
          globalPrefix: newEnv.globalPrefix,
          provider: newEnv.provider,
          region: newEnv.region,
          services: newEnv.services || {},
          terraformBackend: newEnv.terraformBackend || null,
          gitRepository: newEnv.gitRepository || null,
          cloudCredentialId: newEnv.cloudCredentialId || null,
        };
        await onCreateEnvironment(config);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        success(`Environment "${newEnv.name}" created successfully`, {
          title: "Environment Created",
          duration: 4000,
        });
        navigate("/environments");
      }
    } catch (err) {
      error(
        `Failed to ${isEditMode ? "update" : "create"} environment: ${err.message}`,
        {
          title: "Error",
          duration: 7000,
        },
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!canGoNext) {
      setShowErrors(true);
      if (validationErrors.length > 0) {
        error(`Validation Error: ${validationErrors[0].message}`, {
          title: "Configuration Invalid",
          duration: 5000,
        });
      }
      return;
    }
    setShowErrors(false);
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1 && !(isEditMode && currentStep === 2)) {
      setShowErrors(false);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAskAI = (service, serviceTitle) =>
    setAiChatModal({
      isOpen: true,
      service,
      serviceTitle,
      wizardValues: newEnv,
    });

  const handleSaveHelmValues = () => {
    const k8s = newEnv.provider === "azure" ? "aks" : "eks";
    if (!newEnv.services?.[k8s]) {
      setValuesEditor(null);
      setEditingHelmValues("");
      return;
    }
    setNewEnv({
      ...newEnv,
      services: {
        ...newEnv.services,
        [k8s]: {
          ...newEnv.services[k8s],
          helmCharts: {
            ...newEnv.services[k8s]?.helmCharts,
            [valuesEditor]: {
              ...newEnv.services[k8s]?.helmCharts?.[valuesEditor],
              customValues: true,
            },
          },
        },
      },
    });
    setValuesEditor(null);
    setEditingHelmValues("");
  };

  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  const activeStep = steps[currentStep - 1];

  if (!newEnv) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1 min-h-0">
        {/* Wizard steps sidebar */}
        <WizardStepSidebar
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          isEditMode={isEditMode}
          progressPercent={progressPercent}
          onStepChange={handleStepChange}
        />

        {/* Center: form + sticky footer */}
        <main className="flex flex-1 min-w-0 flex-col">
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <div className="px-8 py-8">
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-4xl font-extrabold text-primary">
                    {isEditMode ? "Edit Environment" : "Create New Environment"}
                  </h1>
                  {!isEditMode && savedAt && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-tertiary">
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                      Draft saved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-secondary">{activeStep?.description}</p>
              </div>
              <WizardStepContent
                currentId={currentId}
                newEnv={newEnv}
                setNewEnv={setNewEnv}
                expandedServices={expandedServices}
                setExpandedServices={setExpandedServices}
                onAskAI={handleAskAI}
                showErrors={showErrors}
                validationErrors={validationErrors}
                onEditHelmValues={(chart, values) => {
                  setValuesEditor(chart);
                  setEditingHelmValues(values);
                }}
                isEditMode={isEditMode}
                onEditStep={(stepId) => {
                  // Step 1 stays unreachable in edit mode — the sidebar and the
                  // Previous button already refuse it; this was the last way in.
                  if (isEditMode && stepId === "basic") return;
                  setCurrentStep(activeIds.indexOf(stepId) + 1);
                }}
              />
            </div>
          </div>

          <WizardFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            progressPercent={progressPercent}
            isEditMode={isEditMode}
            isLoading={isLoading}
            canGoNext={canGoNext}
            onCancel={() => navigate("/environments")}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={submit}
          />
        </main>

        {/* AI assistant */}
        <aside className="hidden xl:block w-96 shrink-0 border-l border-border p-4 sticky top-20 h-[calc(100vh-5rem)]">
          <WizardAssistant
            context={{
              name: newEnv.name,
              provider: newEnv.provider,
              region: newEnv.region,
              step: currentStep,
            }}
          />
        </aside>
      </div>

      {aiChatModal.isOpen && (
        <AIChatModal
          isOpen={aiChatModal.isOpen}
          onClose={() =>
            setAiChatModal({ isOpen: false, service: null, serviceTitle: null })
          }
          service={aiChatModal.service}
          serviceTitle={aiChatModal.serviceTitle}
          wizardValues={newEnv}
          setNewEnv={setNewEnv}
          messages={aiChatMessages[aiChatModal.service] || []}
          setMessages={(update) =>
            setAiChatMessages((prev) => {
              const current = prev[aiChatModal.service] || [];
              const next =
                typeof update === "function" ? update(current) : update;
              return { ...prev, [aiChatModal.service]: next };
            })
          }
        />
      )}

      {valuesEditor && (
        <HelmValuesModal
          chartName={valuesEditor}
          values={editingHelmValues}
          onChange={setEditingHelmValues}
          onClose={() => setValuesEditor(null)}
          onSave={handleSaveHelmValues}
        />
      )}
    </div>
  );
};

export default WizardPage;
