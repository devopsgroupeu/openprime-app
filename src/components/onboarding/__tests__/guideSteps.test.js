import {
  awsPoints,
  deployKeysLink,
  normalizeRepoAddress,
  pushPoint,
  whereHint,
  wizardPoints,
} from "../guideSteps";

const wizard = (fields) => ({
  part: 1,
  partCount: 3,
  partTitle: "Basic Configuration",
  name: "",
  repoUrl: "",
  ...fields,
});
const currentLabel = (points) => points.find((point) => !point.done)?.label;

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

describe("awsPoints", () => {
  it("starts at opening the terminal", () => {
    expect(currentLabel(awsPoints({}))).toBe("Open the AWS terminal");
  });

  // Someone who opened CloudShell by hand and copied the command did both.
  it("only moves forward", () => {
    const points = awsPoints({ copied: true });
    expect(points[0].done).toBe(true);
    expect(currentLabel(points)).toBe("Paste the line it prints");
  });

  it("points at Connect once the pasted line is recognized", () => {
    const last = awsPoints({ parsed: true }).at(-1);
    expect(last.target).toBe("aws-connect");
  });
});

describe("wizardPoints", () => {
  it("goes name, repository, key, create", () => {
    expect(currentLabel(wizardPoints(wizard({})))).toBe("Name it");
    expect(currentLabel(wizardPoints(wizard({ name: "prod" })))).toBe(
      "Paste your repository address",
    );
    expect(
      currentLabel(
        wizardPoints(
          wizard({ name: "prod", repoUrl: "git@github.com:acme/infra.git" }),
        ),
      ),
    ).toBe("Add the key on GitHub");
    expect(
      currentLabel(
        wizardPoints(
          wizard({
            name: "prod",
            repoUrl: "git@github.com:acme/infra.git",
            keyCopied: true,
          }),
        ),
      ),
    ).toBe("Click Create Environment");
  });

  it("counts a key typed in by hand as added", () => {
    const points = wizardPoints(
      wizard({ name: "prod", repoUrl: "x", keyEntered: true }),
    );
    expect(points[2].done).toBe(true);
  });

  it("links the key step to the repository's deploy keys", () => {
    const [, , key] = wizardPoints(
      wizard({ repoUrl: "git@github.com:acme/infra.git" }),
    );
    expect(key.link.href).toBe(
      "https://github.com/acme/infra/settings/keys/new",
    );
  });

  it("says Continue before the last part and Create on it", () => {
    expect(wizardPoints(wizard({ part: 1 })).at(-1).text).toMatch(
      /^Click Continue/,
    );
    expect(wizardPoints(wizard({ part: 3 })).at(-1).text).toBe(
      "Click Create Environment.",
    );
  });
});

describe("whereHint", () => {
  it("sends the user back to the part a field is in", () => {
    const [name] = wizardPoints(wizard({ part: 2 }));
    expect(whereHint(name, wizard({ part: 2 }))).toBe(
      "This is in part 1 of the form. Go back with Previous.",
    );
    expect(whereHint(name, wizard({ part: 1 }))).toBeNull();
  });
});

describe("pushPoint", () => {
  it("points at Push to Git when the environment has a repository", () => {
    expect(
      pushPoint({ git_repository: { url: "git@github.com:a/b.git" } }).target,
    ).toBe("push-button");
  });

  it("points at Edit when it has none", () => {
    expect(pushPoint({ git_repository: null }).target).toBe("edit-button");
  });
});
