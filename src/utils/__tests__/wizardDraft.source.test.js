import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, loadDraft, loadDraftCommit } from "../wizardDraft";

// OP-208: a draft is filled in against one version of the service catalog. Once
// the wizard hydrates from the templates, the available services and fields
// change when the TEMPLATES change — not only on a frontend deploy — so a draft
// sitting in localStorage can predate what the user is now looking at.

const env = () => ({ name: "prod", provider: "aws", services: {} });

describe("wizardDraft — catalog provenance", () => {
  beforeEach(() => localStorage.clear());

  it("stamps the commit the draft was built against", () => {
    saveDraft("user-a", env(), { commit: "abc123" });
    expect(loadDraftCommit("user-a")).toBe("abc123");
  });

  it("keeps the stamp OUT of the environment loadDraft returns", () => {
    // The environment is what reaches backfillServices and, on save, the API.
    // Provenance is a localStorage concern and must not leak into either.
    saveDraft("user-a", env(), { commit: "abc123" });
    expect(loadDraft("user-a")).toEqual(env());
    expect(JSON.stringify(loadDraft("user-a"))).not.toContain("abc123");
  });

  it("writes no stamp when there is no commit — the flag-off case", () => {
    // With the runtime catalog off there is no commit at all. An unstamped
    // draft must stay distinguishable from a stamped one, so nothing is written.
    saveDraft("user-a", env());
    expect(loadDraftCommit("user-a")).toBeNull();
    expect(localStorage.getItem("op-wizard-draft:user-a")).not.toContain(
      "__source",
    );
  });

  it("reads null for a draft written before stamping existed", () => {
    // Backward compatibility with drafts already in customers' browsers.
    localStorage.setItem(
      "op-wizard-draft:user-a",
      JSON.stringify({ name: "legacy", provider: "aws" }),
    );
    expect(loadDraftCommit("user-a")).toBeNull();
    expect(loadDraft("user-a")).toEqual({ name: "legacy", provider: "aws" });
  });

  it("returns null rather than throwing on an unreadable draft", () => {
    localStorage.setItem("op-wizard-draft:user-a", "{not json");
    expect(loadDraftCommit("user-a")).toBeNull();
    expect(loadDraft("user-a")).toBeNull();
  });

  it("still strips the ssh key when a commit is stamped", () => {
    // The OP-216 guarantee must survive the new argument.
    saveDraft(
      "user-a",
      { ...env(), gitRepository: { url: "git@x:y.git", sshKey: "PRIVATE" } },
      { commit: "abc123" },
    );
    const raw = localStorage.getItem("op-wizard-draft:user-a");
    expect(raw).not.toContain("PRIVATE");
    expect(raw).toContain("abc123");
  });

  it("overwrites the stamp on the next save", () => {
    // How the warning stops repeating: once restored under a new catalog, the
    // next keystroke re-stamps the draft to the current commit.
    saveDraft("user-a", env(), { commit: "old" });
    saveDraft("user-a", env(), { commit: "new" });
    expect(loadDraftCommit("user-a")).toBe("new");
  });
});
