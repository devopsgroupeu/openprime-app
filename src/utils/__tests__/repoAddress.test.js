import { deployKeysLink, normalizeRepoAddress } from "../repoAddress";

describe("deployKeysLink", () => {
  it.each([
    "git@github.com:acme/infra.git",
    "git@github.com:acme/infra",
    "ssh://git@github.com/acme/infra.git",
    "https://github.com/acme/infra.git",
    "https://github.com/acme/infra/",
  ])("builds the deploy keys page from %s", (url) => {
    expect(deployKeysLink(url)).toEqual({
      href: "https://github.com/acme/infra/settings/keys/new",
      label: "Open deploy keys for acme/infra",
    });
  });

  it.each(["git@gitlab.com:acme/infra.git", "", "git@github.com:acme"])(
    "has no link for %j",
    (url) => {
      expect(deployKeysLink(url)).toBeNull();
    },
  );
});

describe("normalizeRepoAddress", () => {
  it.each([
    ["https://github.com/acme/infra", "git@github.com:acme/infra.git"],
    ["https://github.com/acme/infra.git", "git@github.com:acme/infra.git"],
    ["github.com/acme/infra/", "git@github.com:acme/infra.git"],
    // Copied from a page inside the repository.
    [
      "https://github.com/acme/infra/tree/main",
      "git@github.com:acme/infra.git",
    ],
    ["  git@github.com:acme/infra.git ", "git@github.com:acme/infra.git"],
    [
      "ssh://git@github.com/acme/infra.git",
      "ssh://git@github.com/acme/infra.git",
    ],
    // GitLab nests groups.
    [
      "https://gitlab.com/acme/platform/infra",
      "git@gitlab.com:acme/platform/infra.git",
    ],
  ])("turns %s into %s", (input, address) => {
    expect(normalizeRepoAddress(input)).toBe(address);
  });

  it.each(["", "infra", "https://github.com/acme", "not an address at all"])(
    "refuses %j",
    (input) => {
      expect(normalizeRepoAddress(input)).toBeNull();
    },
  );
});
