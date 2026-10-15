import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { generateSshKeyPair } from "../../utils/sshKeyPair";

const emptyState = () => ({
  mode: "automatic",
  status: "idle",
  pair: null,
  error: "",
});

export function useSshKeyGeneration({ newEnv, setNewEnv, active, identity }) {
  const [state, setState] = useState(emptyState);
  const latest = useRef(null);
  const session = useRef({ identity, request: null });
  const mounted = useRef(false);
  const selectionVersion = useRef(0);
  const git = newEnv?.gitRepository;
  const enabled = Boolean(git?.enabled);
  const key = git?.sshKey || "";
  const configured = Boolean(git?.sshKeyConfigured);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (session.current.identity !== identity) {
      session.current = { identity, request: null };
      setState(emptyState());
    }
    const next = {
      identity,
      active,
      enabled,
      key,
      configured,
      mode: state.mode,
    };
    if (
      !latest.current ||
      Object.keys(next).some((name) => latest.current[name] !== next[name])
    ) {
      selectionVersion.current += 1;
    }
    latest.current = next;
  }, [identity, active, enabled, key, configured, state.mode]);

  const selectKey = useCallback(
    (privateKey, version) => {
      setNewEnv((prev) => {
        if (
          !mounted.current ||
          selectionVersion.current !== version ||
          !prev?.gitRepository?.enabled
        ) {
          return prev;
        }
        return {
          ...prev,
          gitRepository: { ...prev.gitRepository, sshKey: privateKey },
        };
      });
    },
    [setNewEnv],
  );

  const generate = useCallback(() => {
    const current = latest.current;
    const owner = session.current;
    if (
      !current?.active ||
      !current.enabled ||
      current.mode !== "automatic" ||
      owner.request
    ) {
      return;
    }
    const version = selectionVersion.current;
    const request = generateSshKeyPair();
    owner.request = request;
    setState((prev) => ({ ...prev, status: "generating", error: "" }));

    request
      .then(
        (pair) => {
          if (!mounted.current || session.current !== owner) return;
          setState((prev) => ({ ...prev, pair, status: "ready", error: "" }));
          // A tab switch, manual edit, disable, step change or reset invalidates
          // automatic selection. The completed pair remains downloadable.
          if (selectionVersion.current === version) {
            selectKey(pair.privateKey, version);
          }
        },
        () => {
          if (!mounted.current || session.current !== owner) return;
          setState((prev) => ({
            ...prev,
            status: "error",
            error:
              "Could not generate a key. Use HTTPS or localhost, retry, or use Manual.",
          }));
        },
      )
      .finally(() => {
        if (owner.request === request) owner.request = null;
      });
  }, [selectKey]);

  useEffect(() => {
    if (
      active &&
      enabled &&
      state.mode === "automatic" &&
      state.status === "idle" &&
      !state.pair &&
      !key.trim() &&
      !configured
    ) {
      generate();
    }
  }, [
    active,
    enabled,
    state.mode,
    state.status,
    state.pair,
    key,
    configured,
    generate,
  ]);

  const setMode = (mode) => {
    if (mode === state.mode) return;
    selectionVersion.current += 1;
    setState((prev) => ({ ...prev, mode }));
    if (mode === "manual") {
      selectKey("", selectionVersion.current);
    } else if (state.pair) {
      selectKey(state.pair.privateKey, selectionVersion.current);
    }
  };

  const setManualKey = (value) => {
    selectionVersion.current += 1;
    selectKey(value, selectionVersion.current);
  };

  const useGeneratedKey = () => {
    if (!state.pair || !active || !enabled || state.mode !== "automatic")
      return;
    selectionVersion.current += 1;
    selectKey(state.pair.privateKey, selectionVersion.current);
  };

  return {
    ...state,
    setMode,
    setManualKey,
    generate,
    useGeneratedKey,
    isSelected: Boolean(state.pair && key === state.pair.privateKey),
  };
}
