import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Circle, ExternalLink, ListChecks, X } from "lucide-react";

// Step-by-step guide from sign-up to a running environment (OP-283). Written for
// someone without a technical background: one sentence per step, one button,
// and a done state the app can see for itself wherever it can.
//
// Deployment runs in the user's own pipeline, which the app does not track yet,
// so the last step is ticked by the user. Both that tick and "Hide" live in
// localStorage, i.e. per browser. A hidden guide collapses to one line with a
// "Show" button rather than disappearing, so it can always be brought back.

const HIDDEN_KEY = "openprime-onboarding-hidden";
const DEPLOYED_KEY = "openprime-onboarding-deployed";
const OWN_REPO_KEY = "openprime-onboarding-own-repo";

const NEW_GITHUB_REPO_URL = "https://github.com/new";

const readFlag = (key) => {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};

const writeFlag = (key, value = true) => {
  try {
    if (value) localStorage.setItem(key, "true");
    else localStorage.removeItem(key);
  } catch {
    // Private mode or blocked storage: the guide still works for this visit.
  }
};

const repoUrlOf = (env) => (env.git_repository || env.gitRepository)?.url;
const pushedOk = (env) => env.last_push_status === "succeeded";

const DEPLOY_HOW_TO = [
  "In your repository on GitHub, open Settings → Secrets and variables → Actions.",
  "Add two secrets with the same AWS key you gave OpenPrime: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
  "Open Actions → Terraform Deployment → Run workflow, and choose apply.",
  "The run opens an issue in your repository. Comment approve on it to let it continue.",
];

const OnboardingGuide = ({
  environments = [],
  hasCredentials = false,
  onConnectAws,
}) => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(() => readFlag(HIDDEN_KEY));
  const [deployed, setDeployed] = useState(() => readFlag(DEPLOYED_KEY));
  const [ownRepo, setOwnRepo] = useState(() => readFlag(OWN_REPO_KEY));
  const [showDeployHowTo, setShowDeployHowTo] = useState(false);

  const pushTarget =
    environments.find((env) => !pushedOk(env)) || environments[0];

  const steps = [
    {
      id: "aws",
      title: "Connect your AWS account",
      description:
        "OpenPrime needs access to your AWS account to build things in it. It takes one copy and paste.",
      done: hasCredentials,
      action: onConnectAws && { label: "Connect AWS", onClick: onConnectAws },
    },
    {
      id: "repo",
      title: "Create an empty repository on GitHub",
      description:
        "Your infrastructure code will live there. Create it empty and private, then copy its SSH address (it starts with git@github.com:).",
      done: ownRepo || environments.some((env) => Boolean(repoUrlOf(env))),
      action: { label: "Open GitHub", href: NEW_GITHUB_REPO_URL },
      secondary: {
        label: "I already have a repository",
        onClick: () => {
          writeFlag(OWN_REPO_KEY);
          setOwnRepo(true);
        },
      },
      // The push copies the generated tree over a clone of the branch, so files
      // with the same path are replaced (backend environmentService push).
      note: "Using one you already have? OpenPrime adds its files next to yours and replaces files with the same name, such as README.md.",
    },
    {
      id: "environment",
      title: "Describe your environment",
      description:
        "Pick what you need, for example a Kubernetes cluster and a database. Paste the repository address, click Generate key and add that key to the repository under Settings → Deploy keys, with write access.",
      done: environments.length > 0,
      action: {
        label: "Create environment",
        onClick: () => navigate("/environments/create"),
      },
    },
    {
      id: "push",
      title: "Send the code to your repository",
      description:
        "OpenPrime writes the infrastructure code and pushes it to your repository.",
      done: environments.some(pushedOk),
      action: pushTarget && {
        label: "Open environment",
        onClick: () => navigate(`/environments/${pushTarget.id}`),
      },
    },
    {
      id: "deploy",
      title: "Start the deployment",
      description:
        "Your repository's pipeline creates the infrastructure in your AWS account.",
      done: deployed,
      action: {
        label: showDeployHowTo ? "Hide steps" : "Show me how",
        onClick: () => setShowDeployHowTo((open) => !open),
      },
      secondary: {
        label: "Mark as done",
        onClick: () => {
          writeFlag(DEPLOYED_KEY);
          setDeployed(true);
        },
      },
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  if (doneCount === steps.length) return null;

  if (hidden) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 mb-8">
        <p className="flex items-center gap-2 text-sm text-secondary">
          <ListChecks className="w-4 h-4 text-accent" aria-hidden="true" />
          Setup guide: {doneCount} of {steps.length} done
        </p>
        <button
          type="button"
          onClick={() => {
            writeFlag(HIDDEN_KEY, false);
            setHidden(false);
          }}
          className="text-sm font-semibold text-accent hover:underline"
        >
          Show
        </button>
      </div>
    );
  }

  const currentId = steps.find((step) => !step.done)?.id;

  return (
    <section
      aria-labelledby="onboarding-guide-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-elevation-1 mb-8"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2
            id="onboarding-guide-heading"
            className="text-lg font-extrabold text-primary"
          >
            Get your first environment running
          </h2>
          <p className="text-sm text-secondary mt-1">
            {doneCount} of {steps.length} done
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            writeFlag(HIDDEN_KEY);
            setHidden(true);
          }}
          className="flex items-center gap-1 text-sm text-tertiary hover:text-primary"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Hide
        </button>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentId;
          const StatusIcon = step.done ? CheckCircle : Circle;
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                step.done
                  ? "bg-background border-border opacity-70"
                  : isCurrent
                    ? "bg-background border-primary"
                    : "bg-background border-border"
              }`}
            >
              <StatusIcon
                aria-label={step.done ? "Done" : "Not done"}
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  step.done ? "text-success" : "text-tertiary"
                }`}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-bold ${
                    step.done ? "text-secondary" : "text-primary"
                  }`}
                >
                  {index + 1}. {step.title}
                </h3>
                {!step.done && (
                  <>
                    <p className="text-sm text-secondary mt-1">
                      {step.description}
                    </p>
                    {step.id === "deploy" && showDeployHowTo && (
                      <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm text-secondary">
                        {DEPLOY_HOW_TO.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ol>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {step.action?.href ? (
                        <a
                          href={step.action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            isCurrent ? "btn-op-primary" : "btn-op-secondary"
                          }
                        >
                          {step.action.label}
                          <ExternalLink
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        step.action && (
                          <button
                            type="button"
                            onClick={step.action.onClick}
                            className={
                              isCurrent ? "btn-op-primary" : "btn-op-secondary"
                            }
                          >
                            {step.action.label}
                          </button>
                        )
                      )}
                      {step.secondary && (
                        <button
                          type="button"
                          onClick={step.secondary.onClick}
                          className="text-sm font-semibold text-accent hover:underline"
                        >
                          {step.secondary.label}
                        </button>
                      )}
                    </div>
                    {step.note && (
                      <p className="text-xs text-tertiary mt-2">{step.note}</p>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default OnboardingGuide;
