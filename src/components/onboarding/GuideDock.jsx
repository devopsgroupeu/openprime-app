import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Check, ChevronUp, ExternalLink, Minus } from "lucide-react";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useToast } from "../../contexts/ToastContext";
import authService from "../../services/authService";
import CloudCredentialModal from "../modals/CloudCredentialModal";
import GuideSpotlight from "./GuideSpotlight";
import {
  DEPLOY_HOW_TO,
  GITHUB_NEW_REPO_URL,
  STEPS,
  STEP_ORDER,
  awsPoints,
  normalizeRepoAddress,
  pushPoint,
  whereHint,
  wizardPoints,
} from "./guideSteps";

// The setup guide (OP-283): a panel in the bottom-left corner of every page
// until the first environment runs. Same five steps and words everywhere, the
// current one opened up into what to do on this page. "Show me where" rings
// the element and explains the click (GuideSpotlight). It collapses to one
// line but does not go away until all five steps are done. Aura keeps the
// bottom-right corner.

const WIZARD_CREATE = "/environments/create";

const detailIdOf = (pathname) => {
  const id = pathname.match(/^\/environments\/([^/]+)\/?$/)?.[1];
  return id && id !== "create" ? id : null;
};

const ProgressRing = ({ done, size }) => {
  const radius = 15;
  const length = 2 * Math.PI * radius;
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        strokeWidth="4"
        className="stroke-border"
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(length * done) / STEP_ORDER.length} ${length}`}
        transform="rotate(-90 20 20)"
        className="stroke-primary"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        className="fill-current text-[11px] font-bold"
      >
        {done}/{STEP_ORDER.length}
      </text>
    </svg>
  );
};

// Step 2's done state. OpenPrime cannot see a repository created on GitHub, so
// the step asks for the one thing the user needs next anyway: its address.
// Pasting it is "done", and the wizard fills it in later.
const RepoAddressForm = ({ onSave }) => {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const input = useRef(null);

  // Back from GitHub in another tab: the cursor is already where the address
  // goes.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && !input.current?.value) {
        input.current?.focus();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    const address = normalizeRepoAddress(value);
    if (address) onSave(address);
    else setInvalid(true);
  };

  return (
    <form onSubmit={submit} className="w-full space-y-2">
      <label
        htmlFor="guide-repo-address"
        className="block text-xs text-secondary"
      >
        Created it? Paste the address from your browser:
      </label>
      <input
        id="guide-repo-address"
        ref={input}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setInvalid(false);
        }}
        placeholder="https://github.com/you/infra"
        aria-invalid={invalid}
        aria-describedby={invalid ? "guide-repo-address-error" : undefined}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary"
      />
      {invalid && (
        <p
          id="guide-repo-address-error"
          role="alert"
          className="text-xs text-danger"
        >
          That is not a repository address. Open the repository on GitHub and
          copy the address from your browser&apos;s address bar.
        </p>
      )}
      <button type="submit" disabled={!value.trim()} className="btn-op-primary">
        Continue
      </button>
    </form>
  );
};

const GuideDock = () => {
  const guide = useOnboarding();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [targetFound, setTargetFound] = useState(false);
  const [showDeployHowTo, setShowDeployHowTo] = useState(false);
  const [justDone, setJustDone] = useState(null);
  const previous = useRef(undefined);
  const ready = Boolean(guide?.ready);
  const current = guide?.current ?? null;
  const setShowing = guide?.setShowing;
  const closeShowing = useCallback(() => setShowing?.(false), [setShowing]);
  // The toast API is a new object on every render; an effect depending on it
  // would re-run and cancel its own timer.
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // A step just ticked: say so in the panel for a moment, so the user sees
  // their action counted before the next step takes its place.
  useEffect(() => {
    if (!ready) return undefined;
    const before = previous.current;
    previous.current = current;
    if (before === undefined || before === null || before === current) {
      return undefined;
    }
    if (current === null) {
      toastRef.current.success("Your first environment is set up.");
      return undefined;
    }
    if (STEP_ORDER.indexOf(current) < STEP_ORDER.indexOf(before)) {
      return undefined;
    }
    // Creating an environment with a repository ticks two steps at once; the
    // one right before the new current step is what the user just did.
    setJustDone(STEPS[STEP_ORDER[STEP_ORDER.indexOf(current) - 1]].doneText);
    const timer = setTimeout(() => setJustDone(null), 8000);
    return () => clearTimeout(timer);
  }, [ready, current]);

  if (!guide?.active) return null;

  const stepIndex = STEP_ORDER.indexOf(current);
  const onWizard = pathname === WIZARD_CREATE && guide.wizard;
  const detailEnv = detailIdOf(pathname)
    ? guide.environments.find((env) => String(env.id) === detailIdOf(pathname))
    : null;

  let points = null;
  if (current === "aws" && guide.awsProgress) {
    points = awsPoints(guide.awsProgress);
  } else if (current === "environment" && onWizard) {
    points = wizardPoints(guide.wizard);
  } else if (current === "push" && detailEnv) {
    points = [pushPoint(detailEnv)];
  }
  const point = points?.find((item) => !item.done) ?? null;
  const hint = onWizard ? whereHint(point, guide.wizard) : null;

  const saveAwsCredential = async (credentialData) => {
    try {
      await authService.post("/cloud-credentials", credentialData);
      guide.closeConnectAws();
      guide.refresh();
      toast.success("AWS account connected");
    } catch (error) {
      const message =
        error.data?.error || error.message || "Could not connect AWS";
      toast.error(message, { title: "AWS connection failed", duration: 7000 });
    }
  };

  const description =
    current === "environment" && onWizard
      ? `One form in ${guide.wizard.partCount} parts. You are in part ${guide.wizard.part}: ${guide.wizard.partTitle}.`
      : STEPS[current].description;

  const actions = {
    aws: !guide.awsProgress && (
      <button
        type="button"
        onClick={guide.connectAws}
        className="btn-op-primary"
      >
        Connect AWS
      </button>
    ),
    repo: (
      <>
        <a
          href={GITHUB_NEW_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-op-primary"
        >
          Open GitHub
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <RepoAddressForm onSave={guide.saveRepoUrl} />
      </>
    ),
    environment: !onWizard && (
      <button
        type="button"
        onClick={() => navigate(WIZARD_CREATE)}
        className="btn-op-primary"
      >
        Create environment
      </button>
    ),
    push: !detailEnv && guide.pushTarget && (
      <button
        type="button"
        onClick={() => navigate(`/environments/${guide.pushTarget.id}`)}
        className="btn-op-primary"
      >
        Open environment
      </button>
    ),
    deploy: (
      <>
        <button
          type="button"
          onClick={() => setShowDeployHowTo((open) => !open)}
          aria-expanded={showDeployHowTo}
          className="btn-op-secondary"
        >
          {showDeployHowTo ? "Hide steps" : "Show me how"}
        </button>
        <button
          type="button"
          onClick={guide.markDeployed}
          className="text-sm font-semibold text-accent hover:underline"
        >
          Mark as done
        </button>
      </>
    ),
  }[current];

  return (
    <>
      {guide.collapsed ? (
        <button
          type="button"
          onClick={() => guide.setCollapsed(false)}
          className="fixed bottom-4 left-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-border bg-surface py-2 pl-2 pr-4 text-left text-sm font-semibold text-primary shadow-2xl"
        >
          <ProgressRing done={guide.doneCount} size={30} />
          <span className="min-w-0">
            <span className="sr-only">Open the setup guide. </span>
            Step {stepIndex + 1} of {STEP_ORDER.length} · {STEPS[current].title}
          </span>
          <ChevronUp className="h-4 w-4 text-tertiary" aria-hidden="true" />
        </button>
      ) : (
        <aside
          aria-label="Setup guide"
          className="fixed bottom-4 left-4 z-[70] flex max-h-[calc(100vh-6rem)] w-[300px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface text-sm text-primary shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <ProgressRing done={guide.doneCount} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Setup guide · {guide.doneCount} of {STEP_ORDER.length} done
              </p>
              <h2 className="font-bold leading-snug">
                Step {stepIndex + 1}: {STEPS[current].title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => guide.setCollapsed(true)}
              aria-label="Collapse the setup guide"
              className="rounded-lg border border-border p-1.5 text-tertiary hover:text-primary"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="custom-scrollbar overflow-y-auto">
            {justDone && (
              <p
                role="status"
                className="mx-3 mt-3 rounded-lg bg-primary-muted px-3 py-2 text-xs font-semibold accent-teal"
              >
                {justDone} Next step below.
              </p>
            )}
            <ol className="space-y-0.5 p-2">
              {STEP_ORDER.map((id, index) => {
                const done = guide.steps[index].done;
                const isCurrent = id === current;
                return (
                  <li
                    key={id}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex gap-3 rounded-xl px-2 py-2 ${isCurrent ? "bg-surface-elevated" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                        done
                          ? "border-primary bg-primary text-inverse"
                          : isCurrent
                            ? "border-primary accent-teal"
                            : "border-border text-tertiary"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3 w-3" aria-label="Done" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          done
                            ? "text-tertiary line-through"
                            : isCurrent
                              ? "font-bold"
                              : "text-secondary"
                        }
                      >
                        {STEPS[id].title}
                      </p>
                      {isCurrent && (
                        <div className="mt-1.5 space-y-2.5">
                          <p className="text-xs text-secondary">
                            {description}
                          </p>
                          {points && (
                            <ol className="space-y-1">
                              {points.map((item) => (
                                <li
                                  key={item.label}
                                  aria-current={
                                    item === point ? "step" : undefined
                                  }
                                  className={`flex items-center gap-2 text-xs ${
                                    item.done
                                      ? "text-tertiary line-through"
                                      : item === point
                                        ? "font-semibold text-primary"
                                        : "text-tertiary"
                                  }`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`h-2 w-2 shrink-0 rounded-full ${
                                      item.done
                                        ? "bg-tertiary"
                                        : item === point
                                          ? "bg-primary"
                                          : "border border-border"
                                    }`}
                                  />
                                  {item.label}
                                </li>
                              ))}
                            </ol>
                          )}
                          {hint && (
                            <p className="text-xs font-semibold accent-teal">
                              {hint}
                            </p>
                          )}
                          {current === "deploy" && showDeployHowTo && (
                            <ol className="list-decimal space-y-1 pl-4 text-xs text-secondary">
                              {DEPLOY_HOW_TO.map((line) => (
                                <li key={line}>{line}</li>
                              ))}
                            </ol>
                          )}
                          {actions && (
                            <div className="flex flex-wrap items-center gap-3">
                              {actions}
                            </div>
                          )}
                          {STEPS[current].note && (
                            <p className="text-xs text-tertiary">
                              {STEPS[current].note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {point && (
            <div className="border-t border-border px-4 py-3">
              <button
                type="button"
                disabled={!targetFound}
                aria-pressed={guide.showing}
                onClick={() => guide.setShowing(!guide.showing)}
                className="btn-op-secondary w-full"
              >
                Show me where
              </button>
            </div>
          )}
        </aside>
      )}

      <GuideSpotlight
        target={guide.collapsed ? null : point?.target}
        showing={guide.showing}
        title={point?.label}
        text={point?.text}
        link={point?.link}
        onClose={closeShowing}
        onFound={setTargetFound}
      />

      <CloudCredentialModal
        provider="aws"
        isOpen={guide.connectingAws}
        onClose={guide.closeConnectAws}
        onSave={saveAwsCredential}
      />
    </>
  );
};

export default GuideDock;
