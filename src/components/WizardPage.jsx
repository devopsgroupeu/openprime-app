// src/components/WizardPage.jsx
// Full-screen environment wizard, outside the app shell: its own top bar, a
// vertical stepper, the step form with its footer, and the Aura column.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { PanelRight } from "lucide-react";
import WizardAssistant from "./WizardAssistant";
import AIChatModal from "./modals/AIChatModal";
import HelmValuesModal from "./modals/HelmValuesModal";
import WizardTopBar from "./wizard-page/WizardTopBar";
import WizardStepSidebar, {
  WizardStepProgress,
} from "./wizard-page/WizardStepSidebar";
import WizardFooter from "./wizard-page/WizardFooter";
import WizardStepContent from "./wizard-page/WizardStepContent";
import { STEP_DEFS } from "./wizard-page/stepDefs";
import { PageHeader } from "@/components/shared/page-header";
import { PageShell } from "@/components/shared/page-shell";
import { guardedNavigate, useUnsavedGuard } from "@/components/shared/save-bar";
import { SettingsPageSkeleton } from "@/components/shared/skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  backfillServices,
  createEmptyEnvironment,
} from "../config/environmentsConfig";
import {
  validateEnvironmentConfig,
  getValidationSummary,
} from "../utils/configValidator";
import authService from "../services/authService";
import { normalizeEnvironment } from "../utils/environmentShape";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import {
  saveDraft,
  loadDraft,
  loadDraftCommit,
  clearDraft,
} from "../utils/wizardDraft";
import { useCatalog } from "../contexts/CatalogContext";
import { useSshKeyGeneration } from "./wizard-page/useSshKeyGeneration.js";

// The Aura column (xl and up) remembers whether it was closed.
const AURA_PANEL_KEY = "op-wizard-aura-open";
const readAuraOpen = () => {
  try {
    return localStorage.getItem(AURA_PANEL_KEY) !== "false";
  } catch {
    return true;
  }
};

// Messages under the Basics fields. The rule is the step's gate (name, prefix,
// provider, region); the domain error is only shown, it does not gate.
const basicFieldErrors = (env, validationErrors) =>
  [
    !env.name?.trim() && {
      field: "name",
      message: "Enter a name for this environment.",
    },
    !env.globalPrefix?.trim() && {
      field: "globalPrefix",
      message: "Enter a resource prefix.",
    },
    !env.region && { field: "region", message: "Choose a region." },
    validationErrors.find((e) => e.field === "domain"),
  ].filter(Boolean);

const WizardPage = ({ onCreateEnvironment, onUpdateEnvironment }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const { commit: catalogCommit } = useCatalog();

  const [newEnv, setNewEnv] = useState(() => {
    if (isEditMode) return null;
    const draft = loadDraft(userId);
    return draft ? backfillServices(draft) : createEmptyEnvironment("aws");
  });
  // Captured during render, not in an effect: the draft-saving effect below is
  // declared first and therefore runs first, rewriting the stamp to the current
  // commit. Reading it in an effect would always compare equal and the warning
  // would never fire.
  const [restoredDraftCommit] = useState(() =>
    isEditMode ? null : loadDraftCommit(userId),
  );
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
  // Edit mode: the loaded environment, to tell whether the user changed it.
  const [baseline, setBaseline] = useState(null);
  const [auraOpen, setAuraOpen] = useState(readAuraOpen);
  // One Aura conversation for the column and the sheet.
  const [auraMessages, setAuraMessages] = useState([]);
  // Bumped when Continue or Create finds errors: focus the first invalid field.
  const [focusRequest, setFocusRequest] = useState(0);
  const scrollerRef = useRef(null);

  // Always land at the top when opening the wizard or switching steps.
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [currentStep]);

  useEffect(() => {
    if (!focusRequest) return;
    const field = scrollerRef.current?.querySelector('[aria-invalid="true"]');
    if (!field) return;
    field.scrollIntoView({ block: "center" });
    field.focus({ preventScroll: true });
  }, [focusRequest]);

  // Load environment for edit mode. Editing opens on step 2 because that is
  // where most changes are, but step 1 stays reachable: it is no longer wholly
  // read-only: only Environment Name and Global Prefix are locked, and the
  // domain added for OP-244 is editable precisely so a customer who delegates a
  // domain later does not have to recreate the environment.
  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    (async () => {
      try {
        const env = await authService.get(`/environments/${id}`);
        if (!active) return;
        // The API answers in snake_case; the wizard reads camelCase.
        const loaded = backfillServices(normalizeEnvironment(env));
        setNewEnv(loaded);
        setBaseline(JSON.stringify(loaded));
        setCurrentStep(2);
        setCompletedSteps(new Set([1]));
      } catch (err) {
        error(`Couldn't load the environment. ${err.message}`, {
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
    if (saveDraft(userId, newEnv, { commit: catalogCommit }))
      setSavedAt(Date.now());
  }, [newEnv, isEditMode, userId, catalogCommit]);

  // A draft restored from localStorage was filled in against one version of the
  // service catalog. Once the wizard builds itself from the templates, that set
  // of services and fields changes when the TEMPLATES change, not only on a
  // frontend deploy — so a draft can predate fields the user is now looking at.
  //
  // Told, not acted on: the draft is kept exactly as it was. Silently dropping
  // or rewriting a half-finished environment is worse than a stale field, and
  // backfillServices() already adds anything newly on offer.
  const [warned, setWarned] = useState(false);
  useEffect(() => {
    if (isEditMode || warned || !catalogCommit) return;
    // A missing stamp means "cannot tell", not "mismatch" — a draft written
    // before stamping existed, or written with the runtime catalog off, has
    // none. Warning on it would nag every returning user for nothing.
    if (!restoredDraftCommit || restoredDraftCommit === catalogCommit) return;
    setWarned(true);
    info(
      "This draft was started against an earlier version of the service catalog. It was kept as it was, so some options may have changed since.",
    );
  }, [isEditMode, warned, catalogCommit, restoredDraftCommit, info]);

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
  const sshKeys = useSshKeyGeneration({
    newEnv,
    setNewEnv,
    active: currentId === "basic",
    identity: `${userId || "anonymous"}:${id || "create"}`,
  });

  // The gate of the Basics step; every other step always lets the user on.
  const basicsComplete = Boolean(
    newEnv?.name?.trim() &&
    newEnv?.globalPrefix?.trim() &&
    newEnv?.provider &&
    newEnv?.region,
  );

  const validateCurrentStep = useCallback(() => {
    if (!newEnv) return false;
    try {
      const errors = validateEnvironmentConfig(newEnv);
      setValidationErrors(getValidationSummary(errors).errors);
    } catch {
      setValidationErrors([]);
    }
    return currentId === "basic" ? basicsComplete : true;
  }, [newEnv, currentId, basicsComplete]);

  const canGoNext = useMemo(() => validateCurrentStep(), [validateCurrentStep]);

  const dirty = useMemo(
    () =>
      isEditMode && baseline !== null && JSON.stringify(newEnv) !== baseline,
    [isEditMode, baseline, newEnv],
  );
  const leaveGuard = useUnsavedGuard(dirty && !isLoading);

  const showFieldErrors = () => {
    setShowErrors(true);
    setFocusRequest((n) => n + 1);
  };

  const handleStepChange = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.has(stepNumber)) {
      setShowErrors(false);
      setCurrentStep(stepNumber);
    }
  };

  const submit = async () => {
    // Reachable through the stepper with an emptied Basics step: send the
    // user back to the fields instead of a toast.
    if (!newEnv?.name || !newEnv?.globalPrefix) {
      setCurrentStep(1);
      showFieldErrors();
      return;
    }
    setIsLoading(true);
    try {
      if (isEditMode) {
        await onUpdateEnvironment({ ...newEnv });
        success(`Saved changes to ${newEnv.name}.`, { duration: 4000 });
        navigate(`/environments/${id}`);
      } else {
        const config = {
          name: newEnv.name,
          globalPrefix: newEnv.globalPrefix,
          provider: newEnv.provider,
          region: newEnv.region,
          domain: newEnv.domain || null,
          services: newEnv.services || {},
          terraformBackend: newEnv.terraformBackend || null,
          gitRepository: newEnv.gitRepository || null,
          cloudCredentialId: newEnv.cloudCredentialId || null,
        };
        await onCreateEnvironment(config);
        try {
          clearDraft(userId);
        } catch {
          /* ignore */
        }
        success(`Created ${newEnv.name}.`, { duration: 4000 });
        navigate("/environments");
      }
    } catch (err) {
      error(
        `Couldn't ${isEditMode ? "save changes to" : "create"} ${newEnv.name}. ${err.message}`,
        { duration: 7000 },
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!canGoNext) {
      showFieldErrors();
      return;
    }
    setShowErrors(false);
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
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

  // Create mode leaves without asking: the draft is already saved. Edit mode
  // asks first when there are unsaved edits (useUnsavedGuard).
  const leaveTo = isEditMode ? `/environments/${id}` : "/environments";
  const handleCancel = () => {
    if (isEditMode) {
      guardedNavigate(() => navigate(leaveTo));
      return;
    }
    if (savedAt) info("Draft saved. Resume it from New environment.");
    navigate(leaveTo);
  };

  const toggleAura = () => {
    const next = !auraOpen;
    setAuraOpen(next);
    try {
      localStorage.setItem(AURA_PANEL_KEY, String(next));
    } catch {
      /* the column just forgets */
    }
  };

  const breadcrumbs = isEditMode
    ? [
        { label: "Environments", to: "/environments" },
        { label: newEnv?.name || "Environment", to: `/environments/${id}` },
        { label: "Edit" },
      ]
    : [
        { label: "Environments", to: "/environments" },
        { label: "New environment" },
      ];

  const assistant = newEnv ? (
    <WizardAssistant
      context={{
        name: newEnv.name,
        provider: newEnv.provider,
        region: newEnv.region,
        step: currentStep,
      }}
      stepId={currentId}
      messages={auraMessages}
      setMessages={setAuraMessages}
    />
  ) : null;

  const topBar = (
    <WizardTopBar
      breadcrumbs={breadcrumbs}
      savedAt={isEditMode ? null : savedAt}
      auraOpen={auraOpen}
      onToggleAura={toggleAura}
      onCancel={handleCancel}
      auraSheet={
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="xl:hidden">
              <PanelRight aria-hidden />
              Aura
            </Button>
          </SheetTrigger>
          <SheetContent
            aria-describedby={undefined}
            className="w-full gap-0 p-0 sm:max-w-md"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              e.currentTarget.querySelector("textarea")?.focus();
            }}
          >
            <SheetTitle className="sr-only">Aura</SheetTitle>
            {assistant}
          </SheetContent>
        </Sheet>
      }
    />
  );

  if (!newEnv) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        {topBar}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PageShell width="settings">
            <SettingsPageSkeleton />
          </PageShell>
        </div>
      </div>
    );
  }

  const stepperSteps = steps.map((step) => ({
    ...step,
    invalid:
      step.id === "basic" && completedSteps.has(step.number) && !basicsComplete,
  }));
  const activeStep = steps[currentStep - 1];

  return (
    <div className="flex h-dvh flex-col bg-background">
      {topBar}
      <div className="flex min-h-0 flex-1">
        <WizardStepSidebar
          steps={stepperSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepChange={handleStepChange}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
            <PageShell key={currentId} width="settings">
              <div className="flex flex-col gap-3">
                <WizardStepProgress steps={steps} currentStep={currentStep} />
                <PageHeader
                  title={activeStep?.title}
                  description={activeStep?.summary}
                  documentTitle={
                    isEditMode ? `Edit ${newEnv.name}` : "New environment"
                  }
                />
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
                basicErrors={basicFieldErrors(newEnv, validationErrors)}
                onEditHelmValues={(chart, values) => {
                  setValuesEditor(chart);
                  setEditingHelmValues(values);
                }}
                isEditMode={isEditMode}
                onEditStep={(stepId) => {
                  // Review's Edit and problem links. Basics is reachable in
                  // edit mode too (its domain is editable); with problems it
                  // opens on the first invalid field.
                  setCurrentStep(activeIds.indexOf(stepId) + 1);
                  if (
                    stepId === "basic" &&
                    basicFieldErrors(newEnv, validationErrors).length > 0
                  )
                    showFieldErrors();
                }}
                sshKeys={sshKeys}
              />
            </PageShell>
          </div>

          <WizardFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            isEditMode={isEditMode}
            isLoading={isLoading}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={submit}
          />
        </main>

        {auraOpen ? (
          <aside
            aria-label="Aura"
            className="hidden w-80 shrink-0 flex-col border-l bg-card xl:flex"
          >
            {assistant}
          </aside>
        ) : null}
      </div>

      <AlertDialog
        open={leaveGuard.pending}
        onOpenChange={(open) => !open && leaveGuard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your edits to {newEnv.name} will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={leaveGuard.leave}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
