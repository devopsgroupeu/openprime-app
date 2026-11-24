import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import authService from "../services/authService";
import { repoUrlOf } from "../components/onboarding/guideSteps";

// State of the setup guide (OP-283) for the whole app, so the guide can follow
// the user from page to page. Each step is worked out from real data where the
// app can see it (a saved AWS key, environments, a successful push). The two
// ticks it cannot see (an existing repository, a deployment run on GitHub) and
// whether the guide is collapsed live in the user's preferences, so the guide
// reads the same on every device.
//
// Pages that host a step report their progress here: the AWS connect dialog
// (setAwsProgress) and the wizard (setWizard). Both are null while closed.

const OnboardingContext = createContext(null);

export const useOnboarding = () => useContext(OnboardingContext);

const pushedOk = (env) => env.last_push_status === "succeeded";

export function OnboardingProvider({
  environments = [],
  refreshEnvironments,
  available = true,
  children,
}) {
  const [prefs, setPrefs] = useState(null);
  const [hasCredentials, setHasCredentials] = useState(null);
  const [connectingAws, setConnectingAws] = useState(false);
  const [awsProgress, setAwsProgress] = useState(null);
  const [wizard, setWizard] = useState(null);
  const [showing, setShowing] = useState(false);
  const prefsRef = useRef({});
  // App passes a new function on every render; keep the latest without making
  // every callback below change with it.
  const refreshEnvironmentsRef = useRef(refreshEnvironments);
  refreshEnvironmentsRef.current = refreshEnvironments;

  const loadCredentials = useCallback(
    () =>
      authService
        .get("/cloud-credentials")
        .then((res) => setHasCredentials((res.credentials || []).length > 0))
        // A failed check keeps what we knew; unknown counts as not connected.
        .catch(() => setHasCredentials((known) => known ?? false)),
    [],
  );

  useEffect(() => {
    let active = true;
    authService
      .get("/users/me/preferences")
      .then((res) => {
        if (!active) return;
        prefsRef.current = res.preferences?.onboarding || {};
        setPrefs(prefsRef.current);
      })
      .catch(() => active && setPrefs({}));
    loadCredentials();
    return () => {
      active = false;
    };
  }, [loadCredentials]);

  const refresh = useCallback(() => {
    loadCredentials();
    refreshEnvironmentsRef.current?.();
  }, [loadCredentials]);

  // Something may have changed in another tab (a key saved, a push started
  // there): look again when the user comes back to this one.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  // Preferences merge one level deep on the server, so the whole object goes.
  const savePrefs = useCallback((patch) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    authService
      .put("/users/me/preferences", { onboarding: next })
      .catch((error) =>
        console.error("Failed to save the setup guide:", error),
      );
  }, []);

  const steps = useMemo(
    () => [
      { id: "aws", done: Boolean(hasCredentials) },
      {
        id: "repo",
        done:
          Boolean(prefs?.ownRepo) ||
          environments.some((env) => Boolean(repoUrlOf(env))),
      },
      { id: "environment", done: environments.length > 0 },
      { id: "push", done: environments.some(pushedOk) },
      { id: "deploy", done: Boolean(prefs?.deployed) },
    ],
    [hasCredentials, prefs, environments],
  );

  const ready = available && prefs !== null && hasCredentials !== null;
  const current = steps.find((step) => !step.done)?.id ?? null;
  const doneCount = steps.filter((step) => step.done).length;

  // The environment the push step leads to: one with a repository that has
  // not been pushed yet, else any with a repository, else the newest.
  const pushTarget =
    environments.find((env) => repoUrlOf(env) && !pushedOk(env)) ||
    environments.find((env) => repoUrlOf(env)) ||
    environments[0] ||
    null;

  // "Show me where" was asked for one step; the next step starts quiet again.
  useEffect(() => setShowing(false), [current]);

  const value = useMemo(
    () => ({
      ready,
      active: ready && current !== null,
      steps,
      current,
      doneCount,
      environments,
      pushTarget,
      collapsed: Boolean(prefs?.collapsed),
      setCollapsed: (collapsed) => savePrefs({ collapsed }),
      markOwnRepo: () => savePrefs({ ownRepo: true }),
      markDeployed: () => savePrefs({ deployed: true }),
      connectingAws,
      connectAws: () => setConnectingAws(true),
      closeConnectAws: () => setConnectingAws(false),
      awsProgress,
      setAwsProgress,
      wizard,
      setWizard,
      showing,
      setShowing,
      refresh,
    }),
    [
      ready,
      current,
      steps,
      doneCount,
      environments,
      pushTarget,
      prefs,
      savePrefs,
      connectingAws,
      awsProgress,
      wizard,
      showing,
      refresh,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
