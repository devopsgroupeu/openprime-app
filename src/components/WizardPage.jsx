// src/components/WizardPage.jsx
// The environment wizard, a page of the app shell: it fills the content area
// with a vertical stepper, the step form with its footer and the Aura column,
// and puts its controls in the shell's top bar.
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import WizardAssistant from "./WizardAssistant";
import AIChatModal from "./modals/AIChatModal";
import WizardActions from "./wizard-page/WizardActions";
import WizardStepSidebar, {
  WizardStepProgress,
} from "./wizard-page/WizardStepSidebar";
import WizardFooter from "./wizard-page/WizardFooter";
import WizardStepContent from "./wizard-page/WizardStepContent";
import { STEP_DEFS } from "./wizard-page/stepDefs";
import { TopBarActions } from "@/components/layout/AppTopBar";
import { AuraMark } from "@/components/shared/aura-mark";
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
import { describeError } from "@/lib/describe-error";
import {
  backfillServices,
  createEmptyEnvironment,
} from "../config/environmentsConfig";
import { getProviderRegions } from "../config/providersConfig";
import { validateEnvironmentConfig } from "../utils/configValidator";
import { basicFieldErrors } from "./wizard-page/basicErrors";
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

// The Aura column (2xl and up) remembers whether it was closed.
const AURA_PANEL_KEY = "op-wizard-aura-open";
const readAuraOpen = () => {
  try {
    return localStorage.getItem(AURA_PANEL_KEY) !== "false";
  } catch {
    return true;
  }
};

// JSON for "did anything change": key order and empty values ("", null) do not
// count, so switching a section off and on again is no edit.
const comparable = (env) =>
  JSON.stringify(env, (_, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => v !== "" && v !== null)
            .sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : value,
  );

const WizardPage = ({ onCreateEnvironment, onUpdateEnvironment }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const { commit: catalogCommit } = useCatalog();

  // Create mode opens on the stored draft or on an empty environment.
  const [initial] = useState(() => {
    if (isEditMode) return { env: null, restored: false };
    const draft = loadDraft(userId);
    return draft
      ? { env: backfillServices(draft), restored: true }
      : { env: createEmptyEnvironment("aws"), restored: false };
  });
  const [newEnv, setNewEnv] = useState(initial.env);
  // Create mode without a restored draft: the untouched wizard (comparable).
  // Until the environment differs from it there is no draft to keep.
  const [blank, setBlank] = useState(() =>
    isEditMode || initial.restored ? null : comparable(initial.env),
  );
  // Captured during render, not in an effect: the draft-saving effect below is
  // declared first and therefore runs first, rewriting the stamp to the current
  // commit. Reading it in an effect would always compare equal and the warning
  // would never fire.
  const [restoredDraftCommit] = useState(() =>
    isEditMode ? null : loadDraftCommit(userId),
  );
  const [savedAt, setSavedAt] = useState(null);
  // Create mode: the wizard opened on a stored draft, until Start over.
  const [draftRestored, setDraftRestored] = useState(initial.restored);
  const [confirmStartOver, setConfirmStartOver] = useState(false);
  // Start over ran from its dialog: it moves focus itself (its trigger is
  // gone); Keep draft and Escape give it back to the trigger.
  const startedOver = useRef(false);
  // The default region preference, for a wizard started over.
  const [preferredRegion, setPreferredRegion] = useState(null);
  // Bumped by Start over: the steps and the deploy key state start afresh.
  const [resetCount, setResetCount] = useState(0);
  const [expandedServices, setExpandedServices] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  // Errors stay hidden until the user actually tries to advance a step.
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiChatModal, setAiChatModal] = useState({
    isOpen: false,
    service: null,
    serviceTitle: null,
  });
  const [aiChatMessages, setAiChatMessages] = useState({});
  // What was typed to Aura about each service, kept when its dialog closes.
  const [aiChatDrafts, setAiChatDrafts] = useState({});
  // Edit mode: the loaded environment, to tell whether the user changed it.
  const [baseline, setBaseline] = useState(null);
  const [auraOpen, setAuraOpen] = useState(readAuraOpen);
  // One Aura conversation and draft for the column and the sheet.
  const [auraMessages, setAuraMessages] = useState([]);
  const [auraDraft, setAuraDraft] = useState("");
  // Leaving drops the conversations: an answer still coming is stopped, which
  // closes its connection (the backend then stops the model too).
  const conversations = useRef(null);
  useEffect(() => {
    conversations.current = [auraMessages, ...Object.values(aiChatMessages)];
  });
  useEffect(
    () => () =>
      conversations.current
        ?.flat()
        .forEach((message) => message.pending && message.stop?.()),
    [],
  );
  // Where focus goes after the next render: the first match of `selector` in
  // the step (the first invalid field when Continue or Create found errors,
  // Name after Start over; no match leaves focus where it is), or without a
  // selector the step's h1. The control that had focus is often gone: a step
  // change unmounts the stepper row, Back or Review's Edit, and the presets
  // and Clear all remove themselves.
  const [focusTarget, setFocusTarget] = useState(null);
  const focusStep = (selector = null) => setFocusTarget({ selector });
  const scrollerRef = useRef(null);
  const headingRef = useRef(null);

  // Always land at the top when opening the wizard or switching steps.
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [currentStep]);

  useEffect(() => {
    if (!focusTarget) return;
    const field =
      focusTarget.selector &&
      scrollerRef.current?.querySelector(focusTarget.selector);
    if (field) {
      field.scrollIntoView({ block: "center" });
      field.focus({ preventScroll: true });
    } else if (!focusTarget.selector) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [focusTarget]);

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
        setBaseline(comparable(loaded));
        setCurrentStep(2);
        setCompletedSteps(new Set([1]));
      } catch (err) {
        error(describeError(err, "load the environment"), { duration: 6000 });
        navigate("/environments");
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEditMode]);

  // Persist the in-progress draft (create mode only) so a refresh or navigation
  // away doesn't lose the configuration. Cleared on successful create, and
  // while the wizard is untouched. "Draft saved" shows from the first change:
  // re-saving the restored draft as it was is not one.
  const untouched = blank !== null && comparable(newEnv) === blank;
  useEffect(() => {
    if (isEditMode || !newEnv) return;
    if (untouched) {
      clearDraft(userId);
      setSavedAt(null);
      return;
    }
    if (
      saveDraft(userId, newEnv, { commit: catalogCommit }) &&
      newEnv !== initial.env
    )
      setSavedAt(Date.now());
  }, [newEnv, untouched, isEditMode, userId, catalogCommit, initial.env]);

  // Settings > Preferences: the default region pre-fills a new wizard (also
  // one started over), never a restored draft and never a region the user
  // already picked.
  useEffect(() => {
    if (isEditMode) return;
    let active = true;
    authService
      .get("/users/me/preferences")
      .then(({ preferences }) => {
        const region = preferences?.defaultRegion;
        const offered = getProviderRegions(initial.env.provider).some(
          (r) => r.value === region,
        );
        if (!active || !offered) return;
        setPreferredRegion(region);
        if (initial.restored) return;
        setNewEnv((env) =>
          env.region === initial.env.region ? { ...env, region } : env,
        );
        setBlank(comparable({ ...initial.env, region }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isEditMode, initial]);

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
  const steps = activeIds.map((id, i) => ({
    ...STEP_DEFS[id],
    // Edit mode saves instead of creating.
    ...(isEditMode && id === "review" && { description: "Check and save" }),
    number: i + 1,
  }));
  const totalSteps = steps.length;
  const currentId = activeIds[currentStep - 1] || "basic";
  const sshKeys = useSshKeyGeneration({
    newEnv,
    setNewEnv,
    active: currentId === "basic",
    identity: `${userId || "anonymous"}:${id || "create"}:${resetCount}`,
  });

  const validationErrors = useMemo(() => {
    if (!newEnv) return [];
    try {
      return validateEnvironmentConfig(newEnv);
    } catch {
      return [];
    }
  }, [newEnv]);
  // The gate of the Basics step and of Create; every other step always lets
  // the user on.
  const basicErrors = useMemo(
    () => (newEnv ? basicFieldErrors(newEnv, validationErrors) : []),
    [newEnv, validationErrors],
  );
  const canGoNext = currentId !== "basic" || basicErrors.length === 0;

  const dirty = useMemo(
    () => isEditMode && baseline !== null && comparable(newEnv) !== baseline,
    [isEditMode, baseline, newEnv],
  );
  const leaveGuard = useUnsavedGuard(dirty && !isLoading);
  // The environment as saved: the tab names it (not the draft being edited),
  // and Basics never offers a new state bucket for the one it has.
  const saved = useMemo(
    () => (baseline ? JSON.parse(baseline) : null),
    [baseline],
  );

  const showFieldErrors = () => {
    setShowErrors(true);
    focusStep('[aria-invalid="true"]');
  };

  const goToStep = (stepNumber) => {
    setShowErrors(false);
    setCurrentStep(stepNumber);
    focusStep();
  };

  const handleStepChange = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.has(stepNumber))
      goToStep(stepNumber);
  };

  const submit = async () => {
    // Reachable through the stepper with Basics problems: send the user back
    // to the fields instead of a toast.
    if (basicErrors.length > 0) {
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
        describeError(
          err,
          `${isEditMode ? "save changes to" : "create"} ${newEnv.name}`,
        ),
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
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleAskAI = (service, serviceTitle) =>
    setAiChatModal({
      isOpen: true,
      service,
      serviceTitle,
      wizardValues: newEnv,
    });

  // Create mode leaves without asking: the draft is already saved. Edit mode
  // asks first when there are unsaved edits (useUnsavedGuard).
  const leaveTo = isEditMode ? `/environments/${id}` : "/environments";
  const handleCancel = () => {
    if (isEditMode) {
      guardedNavigate(() => navigate(leaveTo));
      return;
    }
    // A draft exists once a change was saved, or when one was restored. It
    // never stores the deploy key.
    if (savedAt || draftRestored)
      info(
        newEnv.gitRepository?.sshKey?.trim()
          ? "Draft saved without the deploy key."
          : "Draft saved. Resume it from New environment.",
      );
    navigate(leaveTo);
  };

  // Drops the restored draft for an empty wizard. A draft with enabled
  // services is asked about first.
  const startOver = () => {
    clearDraft(userId);
    const empty = createEmptyEnvironment("aws");
    const env = preferredRegion ? { ...empty, region: preferredRegion } : empty;
    setNewEnv(env);
    setBlank(comparable(env));
    setDraftRestored(false);
    setSavedAt(null);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setShowErrors(false);
    setExpandedServices({});
    setResetCount((n) => n + 1);
    // Start over removes its own button: the cursor goes to the empty Name.
    focusStep("input");
  };
  const enabledServices = Object.values(newEnv?.services || {}).filter(
    (service) => service?.enabled,
  ).length;

  const toggleAura = () => {
    const next = !auraOpen;
    setAuraOpen(next);
    try {
      localStorage.setItem(AURA_PANEL_KEY, String(next));
    } catch {
      /* the column just forgets */
    }
  };

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
      draft={auraDraft}
      setDraft={setAuraDraft}
    />
  ) : null;

  // In the shell's top bar, after its breadcrumbs.
  const actions = (
    <WizardActions
      savedAt={isEditMode ? null : savedAt}
      draftRestored={draftRestored}
      onStartOver={() =>
        enabledServices > 0 ? setConfirmStartOver(true) : startOver()
      }
      auraOpen={auraOpen}
      onToggleAura={toggleAura}
      onCancel={handleCancel}
      // Not before an edited environment has loaded: Aura has nothing yet.
      auraSheet={
        newEnv ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="2xl:hidden">
                <AuraMark />
                <span className="max-sm:sr-only">Aura</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              aria-describedby={undefined}
              className="w-full gap-0 p-0 sm:max-w-md"
              // The Escape that ends an IME composition is not for the sheet.
              onEscapeKeyDown={(e) => e.isComposing && e.preventDefault()}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                e.currentTarget.querySelector("textarea")?.focus();
              }}
            >
              <SheetTitle className="sr-only">Aura</SheetTitle>
              {assistant}
            </SheetContent>
          </Sheet>
        ) : null
      }
    />
  );

  if (!newEnv) {
    return (
      <>
        <TopBarActions>{actions}</TopBarActions>
        <PageShell width="settings">
          <SettingsPageSkeleton />
        </PageShell>
      </>
    );
  }

  const stepperSteps = steps.map((step) => ({
    ...step,
    invalid:
      step.id === "basic" &&
      completedSteps.has(step.number) &&
      basicErrors.length > 0,
  }));
  const activeStep = steps[currentStep - 1];

  return (
    <>
      <TopBarActions>{actions}</TopBarActions>
      {/* Fills the shell's content area; each column scrolls on its own. The
          stepper shows when the area (beside an open or hidden sidebar) has
          room for it next to the form. */}
      <div className="@container/wizard flex h-full min-h-0 border-t">
        <WizardStepSidebar
          steps={stepperSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepChange={handleStepChange}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
            <PageShell key={`${currentId}:${resetCount}`} width="settings">
              <div className="flex flex-col gap-3">
                <WizardStepProgress steps={steps} currentStep={currentStep} />
                <PageHeader
                  headingRef={headingRef}
                  title={activeStep?.title}
                  description={activeStep?.summary}
                  documentTitle={
                    isEditMode
                      ? `Edit ${saved?.name || "environment"}`
                      : "New environment"
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
                basicErrors={basicErrors}
                isEditMode={isEditMode}
                savedBucket={saved?.terraformBackend?.bucketName}
                onEditStep={(stepId) => {
                  // Review's Edit and problem links. Basics is reachable in
                  // edit mode too (its domain is editable); with problems it
                  // opens on the first invalid field.
                  goToStep(activeIds.indexOf(stepId) + 1);
                  if (stepId === "basic" && basicErrors.length > 0)
                    showFieldErrors();
                }}
                focusHeading={() => focusStep()}
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
        </div>

        {auraOpen ? (
          <aside
            aria-label="Aura"
            className="hidden w-80 shrink-0 flex-col border-l bg-card 2xl:flex"
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

      <AlertDialog open={confirmStartOver} onOpenChange={setConfirmStartOver}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            if (startedOver.current) e.preventDefault();
            startedOver.current = false;
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              The draft is cleared, including its {enabledServices} enabled
              service{enabledServices === 1 ? "" : "s"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                startedOver.current = true;
                startOver();
              }}
            >
              Start over
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
          draft={aiChatDrafts[aiChatModal.service] ?? ""}
          setDraft={(text) =>
            setAiChatDrafts((prev) => ({
              ...prev,
              [aiChatModal.service]: text,
            }))
          }
        />
      )}
    </>
  );
};

/**
 * The page of both wizard routes. The router keeps its element when only the
 * wizard changes (an edit to create, one environment's edit to another's),
 * so the key starts each one afresh: no state, draft or Aura conversation
 * carries over.
 */
const KeyedWizardPage = (props) => {
  const { id } = useParams();
  return <WizardPage key={id ? `edit:${id}` : "create"} {...props} />;
};

export default KeyedWizardPage;
