// src/utils/wizardDraft.js
// OP-216: the wizard draft used to be a single global localStorage entry
// holding the whole environment — including the git deploy key — that survived
// logout, so the next person to use the browser inherited it.

const PREFIX = "op-wizard-draft";

/**
 * Draft keys are namespaced per user so two accounts on one browser cannot see
 * each other's in-progress environment. Anonymous drafts keep the bare prefix,
 * which is also the pre-OP-216 key — clearAllDrafts() therefore removes any
 * legacy draft still sitting in a customer's browser.
 */
export function draftKey(userId) {
  return userId ? `${PREFIX}:${userId}` : PREFIX;
}

/**
 * Fields that are never written to localStorage. A draft is convenience state;
 * a write-capable deploy key persisted in it outlives the session, is readable
 * by any script on the origin, and is not what the user agreed to when they
 * pasted it into a form.
 */
function stripSecrets(environment) {
  if (!environment || typeof environment !== "object") return environment;

  const { gitRepository, ...rest } = environment;
  if (!gitRepository || typeof gitRepository !== "object") return environment;

  const { sshKey: _sshKey, ...gitRest } = gitRepository;
  return { ...rest, gitRepository: gitRest };
}

export function saveDraft(userId, environment) {
  try {
    localStorage.setItem(
      draftKey(userId),
      JSON.stringify(stripSecrets(environment)),
    );
    return true;
  } catch {
    return false; // storage unavailable or full — losing a draft is non-fatal
  }
}

export function loadDraft(userId) {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // unreadable draft
  }
}

export function clearDraft(userId) {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {
    /* nothing to do */
  }
}

/**
 * Remove every draft on this browser. Called on logout: which user is logging
 * out is not enough, because a draft written before this change carries no user
 * at all.
 */
export function clearAllDrafts() {
  try {
    // length/key(i) rather than Object.keys: it is the guaranteed Storage API,
    // and Object.keys returns nothing under jsdom. Collect first, then remove —
    // removing during the walk shifts the remaining indices.
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key === PREFIX || key?.startsWith(`${PREFIX}:`)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* nothing to do */
  }
}

export { stripSecrets as __stripSecretsForTest };
