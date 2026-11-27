import { awsPoints, pushPoint, whereHint, wizardPoints } from "../guideSteps";

const wizard = (fields) => ({
  part: 1,
  partCount: 3,
  partTitle: "Basic Configuration",
  name: "",
  repoUrl: "",
  ...fields,
});
const currentLabel = (points) => points.find((point) => !point.done)?.label;

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
  it("goes name, state storage, repository, key, create", () => {
    const after = (fields) => currentLabel(wizardPoints(wizard(fields)));
    const repo = "git@github.com:acme/infra.git";

    expect(after({})).toBe("Name it");
    expect(after({ name: "prod" })).toBe("Create the state storage");
    expect(after({ name: "prod", backendReady: true })).toBe(
      "Paste your repository address",
    );
    expect(after({ name: "prod", backendReady: true, repoUrl: repo })).toBe(
      "Copy the key",
    );
    expect(
      after({
        name: "prod",
        backendReady: true,
        repoUrl: repo,
        keyCopied: true,
      }),
    ).toBe("Add it on GitHub");
    expect(
      after({
        name: "prod",
        backendReady: true,
        repoUrl: repo,
        keyCopied: true,
        deployKeysOpened: true,
      }),
    ).toBe("Click Create Environment");
  });

  // The pipeline refuses to run without remote state (check-backend.sh), and
  // the guide used to skip it.
  it("points at Create Backend Resources until a bucket is set", () => {
    const storage = wizardPoints(wizard({ name: "prod" }))[1];
    expect(storage.target).toBe("wizard-create-backend");
    expect(storage.done).toBe(false);
  });

  // Copying the key used to finish the step and take the link away before
  // GitHub was opened.
  it("keeps the GitHub step open after the key is copied", () => {
    const points = wizardPoints(
      wizard({
        name: "prod",
        backendReady: true,
        repoUrl: "git@github.com:acme/infra.git",
        keyCopied: true,
      }),
    );
    expect(points.find((point) => !point.done).link.href).toBe(
      "https://github.com/acme/infra/settings/keys/new",
    );
  });

  it("has no GitHub step for a repository elsewhere", () => {
    const labels = wizardPoints(
      wizard({ repoUrl: "git@gitlab.com:acme/infra.git" }),
    ).map((point) => point.label);
    expect(labels).not.toContain("Add it on GitHub");
  });

  it("counts a key typed in by hand as added", () => {
    const points = wizardPoints(
      wizard({
        name: "prod",
        backendReady: true,
        repoUrl: "git@github.com:acme/infra.git",
        keyEntered: true,
      }),
    );
    expect(currentLabel(points)).toBe("Click Create Environment");
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
