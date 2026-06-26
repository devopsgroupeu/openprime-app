// src/components/WizardPage.jsx
// Full-page environment wizard (replaces the former modal). InfraFlow 3-column layout:
// WizardSidebar (steps + progress) | step form | live code-preview panel.
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
  Cloud,
  Package,
  ClipboardCheck,
  CheckCircle,
} from "lucide-react";
import AppHeader from "./layout/AppHeader";
import WizardAssistant from "./WizardAssistant";
import BasicConfigStep from "./modals/wizard/BasicConfigStep";
import ServicesConfigStep from "./modals/wizard/ServicesConfigStep";
import HelmChartsStep from "./modals/wizard/HelmChartsStep";
import WizardReviewStep from "./WizardReviewStep";
import AIChatModal from "./modals/AIChatModal";
import HelmValuesModal from "./modals/HelmValuesModal";
import { createEmptyEnvironment } from "../config/environmentsConfig";
import {
  validateEnvironmentConfig,
  getValidationSummary,
} from "../utils/configValidator";
import authService from "../services/authService";
import { useToast } from "../contexts/ToastContext";

const DRAFT_KEY = "op-wizard-draft";

const STEP_DEFS = {
  basic: {
    id: "basic",
    title: "Basic Configuration",
    icon: Settings,
    description: "Environment name and provider",
  },
  services: {
    id: "services",
    title: "Services Configuration",
    icon: Cloud,
    description: "Select and configure services",
  },
  helm: {
    id: "helm",
    title: "Helm Charts",
    icon: Package,
    description: "Configure Kubernetes applications",
  },
  review: {
    id: "review",
    title: "Review",
    icon: ClipboardCheck,
    description: "Review and create your environment",
  },
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [aiChatModal, setAiChatModal] = useState({
    isOpen: false,
    service: null,
    serviceTitle: null,
  });
  const [aiChatMessages, setAiChatMessages] = useState({});
  const [valuesEditor, setValuesEditor] = useState(null);
  const [editingHelmValues, setEditingHelmValues] = useState("");

  // Load environment for edit mode; step 1 (basic config) is read-only when editing.
  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    (async () => {
      try {
        const env = await authService.get(`/environments/${id}`);
        if (!active) return;
        setNewEnv(env);
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
      if (validationErrors.length > 0) {
        error(`Validation Error: ${validationErrors[0].message}`, {
          title: "Configuration Invalid",
          duration: 5000,
        });
      }
      return;
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1 && !(isEditMode && currentStep === 2)) {
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

  const renderStepContent = () => {
    switch (currentId) {
      case "basic":
        return (
          <BasicConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            validationErrors={validationErrors.filter((e) =>
              ["name", "provider", "region"].includes(e.field),
            )}
          />
        );
      case "services":
        return (
          <ServicesConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            expandedServices={expandedServices}
            setExpandedServices={setExpandedServices}
            onAskAI={handleAskAI}
            validationErrors={validationErrors.filter(
              (e) => !["name", "provider", "region"].includes(e.field),
            )}
          />
        );
      case "helm":
        return (
          <HelmChartsStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            onEditHelmValues={(chart, values) => {
              setValuesEditor(chart);
              setEditingHelmValues(values);
            }}
            onAskAI={handleAskAI}
          />
        );
      case "review":
        return (
          <WizardReviewStep
            newEnv={newEnv}
            onEditStep={(stepId) =>
              setCurrentStep(activeIds.indexOf(stepId) + 1)
            }
          />
        );
      default:
        return null;
    }
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
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-surface/40 p-6 sticky top-16 h-[calc(100vh-4rem)]">
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
                  onClick={() => isClickable && handleStepChange(step.number)}
                  disabled={!isClickable}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
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
                      className={`block text-sm font-semibold ${isActive ? "text-primary" : "text-secondary"}`}
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

        {/* Center: form + sticky footer */}
        <main className="flex flex-1 min-w-0 flex-col">
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            <div className="px-8 py-8">
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-3xl font-extrabold text-primary">
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
              {renderStepContent()}
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-between border-t border-border bg-surface px-8 py-4">
            <button
              onClick={() =>
                currentStep === 1 ? navigate("/environments") : handlePrevious()
              }
              disabled={isEditMode && currentStep === 2}
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
              onClick={currentStep < totalSteps ? handleNext : submit}
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
                  <span>
                    {isEditMode ? "Save Changes" : "Create Environment"}
                  </span>
                </>
              )}
            </button>
          </div>
        </main>

        {/* AI assistant */}
        <aside className="hidden xl:block w-96 shrink-0 border-l border-border p-4 sticky top-16 h-[calc(100vh-4rem)]">
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
