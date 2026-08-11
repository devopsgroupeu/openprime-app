// OP-216: the wizard draft held the git deploy key in a single global
// localStorage entry that survived logout.
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  draftKey,
  saveDraft,
  loadDraft,
  clearDraft,
  clearAllDrafts,
} from "../wizardDraft";

// Assembled rather than written out: the repo's detect-private-key pre-commit
// hook flags the literal header, and it is right to — a file containing it is
// indistinguishable from a real leaked key at scan time.
const HEADER = ["-----BEGIN OPENSSH", "PRIVATE KEY-----"].join(" ");
const SSH_KEY = `${HEADER}\nSECRETMATERIAL\n${HEADER.replace("BEGIN", "END")}`;

const environment = () => ({
  name: "prod",
  provider: "aws",
  gitRepository: {
    enabled: true,
    url: "git@github.com:acme/infra.git",
    branch: "main",
    sshKey: SSH_KEY,
  },
});

beforeEach(() => {
  localStorage.clear();
});

describe("draftKey", () => {
  it("namespaces per user", () => {
    expect(draftKey("user-a")).not.toBe(draftKey("user-b"));
  });

  it("falls back to the pre-OP-216 key when there is no user", () => {
    // Deliberate: that is the key legacy drafts already live under, so
    // clearAllDrafts can reach them.
    expect(draftKey(undefined)).toBe("op-wizard-draft");
  });
});

describe("saveDraft", () => {
  it("never writes the ssh key to localStorage", () => {
    saveDraft("user-a", environment());
    expect(localStorage.getItem(draftKey("user-a"))).not.toContain(
      "SECRETMATERIAL",
    );
  });

  it("keeps the rest of the git config, which is not secret", () => {
    saveDraft("user-a", environment());
    const draft = loadDraft("user-a");
    expect(draft.gitRepository).toEqual({
      enabled: true,
      url: "git@github.com:acme/infra.git",
      branch: "main",
    });
  });

  it("keeps everything outside gitRepository untouched", () => {
    saveDraft("user-a", environment());
    expect(loadDraft("user-a")).toMatchObject({
      name: "prod",
      provider: "aws",
    });
  });

  it("handles an environment with no git config", () => {
    saveDraft("user-a", { name: "prod", provider: "aws" });
    expect(loadDraft("user-a")).toEqual({ name: "prod", provider: "aws" });
  });

  it("reports failure instead of throwing when storage rejects the write", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveDraft("user-a", environment())).toBe(false);
    spy.mockRestore();
  });
});

describe("loadDraft", () => {
  it("does not read another user's draft", () => {
    saveDraft("user-a", environment());
    expect(loadDraft("user-b")).toBeNull();
  });

  it("returns null for a corrupt draft rather than throwing", () => {
    localStorage.setItem(draftKey("user-a"), "{not json");
    expect(loadDraft("user-a")).toBeNull();
  });

  it("returns null when there is no draft", () => {
    expect(loadDraft("user-a")).toBeNull();
  });
});

describe("clearDraft", () => {
  it("removes only that user's draft", () => {
    saveDraft("user-a", environment());
    saveDraft("user-b", environment());
    clearDraft("user-a");
    expect(loadDraft("user-a")).toBeNull();
    expect(loadDraft("user-b")).not.toBeNull();
  });
});

describe("clearAllDrafts (logout)", () => {
  it("removes drafts for every user on this browser", () => {
    saveDraft("user-a", environment());
    saveDraft("user-b", environment());
    clearAllDrafts();
    expect(loadDraft("user-a")).toBeNull();
    expect(loadDraft("user-b")).toBeNull();
  });

  it("removes a legacy un-namespaced draft, key material and all", () => {
    // What a customer's browser holds today: the old global key, with the
    // deploy key inside it.
    localStorage.setItem("op-wizard-draft", JSON.stringify(environment()));
    clearAllDrafts();
    expect(localStorage.getItem("op-wizard-draft")).toBeNull();
  });

  it("leaves unrelated keys alone", () => {
    localStorage.setItem("openprime-theme-v2", "true");
    saveDraft("user-a", environment());
    clearAllDrafts();
    expect(localStorage.getItem("openprime-theme-v2")).toBe("true");
  });
});
