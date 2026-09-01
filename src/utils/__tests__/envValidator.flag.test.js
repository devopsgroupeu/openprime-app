import { describe, it, expect, afterEach } from "vitest";
import { getEnvFlag } from "../envValidator";

// The whole point of this helper is that a flag is settable in a *published
// image*. The previous implementation read import.meta.env, which Vite inlines
// at build time and which nothing in the image pipeline sets — so the flag was
// permanently false in production with no way to change it. These tests pin the
// runtime path down.

const RUNTIME_KEY = "USE_RUNTIME_CATALOG";
const BUILD_KEY = "VITE_USE_RUNTIME_CATALOG";

describe("getEnvFlag", () => {
  afterEach(() => {
    delete window._env_;
  });

  it("is false when nothing is set — the state every image ships with", () => {
    expect(getEnvFlag(RUNTIME_KEY, BUILD_KEY)).toBe(false);
  });

  it("reads window._env_, which is what the container substitutes", () => {
    window._env_ = { [RUNTIME_KEY]: "true" };
    expect(getEnvFlag(RUNTIME_KEY, BUILD_KEY)).toBe(true);
  });

  it("treats an unsubstituted template as unset, not as truthy", () => {
    // WHERE THIS ACTUALLY OCCURS, measured rather than assumed: NOT in a
    // container that forgot the variable — envsubst substitutes an unset var to
    // the EMPTY STRING, never leaving the placeholder. Verified against the
    // real dist/env.js:
    //   with    REACT_APP_USE_RUNTIME_CATALOG=true  -> USE_RUNTIME_CATALOG: "true"
    //   without                                     -> USE_RUNTIME_CATALOG: ""
    // The literal "$REACT_APP_..." only survives where envsubst never ran at
    // all: the dev server, which serves public/env.js verbatim. That is the
    // same case getEnvVar's own placeholder guard exists for.
    //
    // Honest note on what this pins: TWO things independently produce `false`
    // here — the placeholder guard, and isTrue() accepting only the exact
    // string "true". Mutating the guard away alone does NOT fail this test, so
    // it is a behaviour guarantee, not proof the guard is load-bearing. The
    // test below is the one that pins the guard.
    window._env_ = { [RUNTIME_KEY]: `$REACT_APP_${RUNTIME_KEY}` };
    expect(getEnvFlag(RUNTIME_KEY, BUILD_KEY)).toBe(false);
  });

  it("an unsubstituted runtime value falls through to build-time, not to false", () => {
    // What the placeholder guard actually buys, and why it is not dead code:
    // under the dev server window._env_ holds placeholders for every key, and
    // without this guard they would MASK the build-time values from .env —
    // breaking local development rather than production.
    process.env.VITE_FALLTHROUGH_PROBE = "true";
    try {
      window._env_ = { FALLTHROUGH_PROBE: "$REACT_APP_FALLTHROUGH_PROBE" };
      expect(getEnvFlag("FALLTHROUGH_PROBE", "VITE_FALLTHROUGH_PROBE")).toBe(
        true,
      );
    } finally {
      delete process.env.VITE_FALLTHROUGH_PROBE;
    }
  });

  it("an empty string — what a container without the variable produces — is off", () => {
    // The real production shape of "not configured". Must be false, and must
    // not fall through to a build-time value either: the container is the
    // authority once envsubst has run.
    process.env.VITE_EMPTY_PROBE = "true";
    try {
      window._env_ = { EMPTY_PROBE: "" };
      expect(getEnvFlag("EMPTY_PROBE", "VITE_EMPTY_PROBE")).toBe(false);
    } finally {
      delete process.env.VITE_EMPTY_PROBE;
    }
  });

  it("only 'true' is true — 'false', '1' and 'yes' are not", () => {
    for (const v of ["false", "1", "yes", "TRUE", ""]) {
      window._env_ = { [RUNTIME_KEY]: v };
      expect(getEnvFlag(RUNTIME_KEY, BUILD_KEY)).toBe(false);
    }
  });

  it("never throws for a missing flag, unlike getEnvVar", () => {
    // getEnvVar fails fast because a missing API URL is unrecoverable. A
    // missing flag is a valid state and must not take the app down.
    expect(() => getEnvFlag("NOT_A_FLAG", "VITE_NOT_A_FLAG")).not.toThrow();
    expect(getEnvFlag("NOT_A_FLAG", "VITE_NOT_A_FLAG")).toBe(false);
  });

  it("runtime injection outranks the build-time value", () => {
    // The container must be able to override whatever the image was built with,
    // otherwise turning the flag back off still needs a rebuild — which is the
    // exact failure this change exists to remove.
    process.env.VITE_PRECEDENCE_PROBE = "true";
    try {
      // Build-time alone: true. Establishes the control, so the assertion below
      // cannot pass just because both sides happen to be false.
      expect(getEnvFlag("PRECEDENCE_PROBE", "VITE_PRECEDENCE_PROBE")).toBe(
        true,
      );

      // Runtime says false and must win.
      window._env_ = { PRECEDENCE_PROBE: "false" };
      expect(getEnvFlag("PRECEDENCE_PROBE", "VITE_PRECEDENCE_PROBE")).toBe(
        false,
      );
    } finally {
      delete process.env.VITE_PRECEDENCE_PROBE;
    }
  });
});
