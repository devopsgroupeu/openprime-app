// What the setup guide says (OP-283). Written for someone without a technical
// background: one sentence per step and one button. Steps that happen inside
// OpenPrime are split into "points": one thing to do, the element it is done on
// (its data-guide name, which the highlight rings) and the sentence shown next
// to it. Pure functions, so the dock and its tests read the same table.

export const STEP_ORDER = ["aws", "repo", "environment", "push", "deploy"];

export const STEPS = {
  aws: {
    title: "Connect your AWS account",
    description:
      "OpenPrime needs access to your AWS account to build things in it. It takes one copy and paste.",
    doneText: "AWS account connected.",
  },
  repo: {
    title: "Create an empty repository on GitHub",
    description:
      "Your infrastructure code will live there. Create it empty and private.",
    // The push copies the generated tree over a clone of the branch, so files
    // with the same path are replaced (backend environmentService push).
    note: "Already have one? Paste its address instead. Files with the same name, such as README.md, get replaced.",
    doneText: "Repository ready.",
  },
  environment: {
    title: "Describe your environment",
    description:
      "Pick what you need, for example a Kubernetes cluster and a database. The guide shows what matters in each part of the form.",
    doneText: "Environment created.",
  },
  push: {
    title: "Send the code to your repository",
    description:
      "OpenPrime writes the infrastructure code and pushes it to your repository.",
    doneText: "Your code is in the repository.",
  },
  deploy: {
    title: "Start the deployment",
    description:
      "Your repository's pipeline builds everything in your AWS account. Until OpenPrime can start it itself, this happens on GitHub.",
    doneText: "Deployment started.",
  },
};

export const GITHUB_NEW_REPO_URL = "https://github.com/new";

export const DEPLOY_HOW_TO = [
  "In your repository on GitHub, open Settings → Secrets and variables → Actions.",
  "Add two secrets with the same AWS key you gave OpenPrime: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
  "Open Actions → Terraform Deployment → Run workflow, and choose apply.",
  "The run opens an issue in your repository. Comment approve on it to let it continue.",
];

// The push needs the SSH address (git@host:owner/repo.git). People paste what
// they have, most often the web address from the browser's address bar, so a
// web address is turned into the SSH one. Null when it is not a repository
// address at all.
export const normalizeRepoAddress = (input = "") => {
  const value = String(input).trim();
  if (/^git@[\w.-]+:[\w.-]+(\/[\w.-]+)+$/.test(value)) return value;
  if (/^ssh:\/\/[\w.-]+@[\w.-]+(:\d+)?(\/[\w.-]+){2,}$/.test(value)) {
    return value;
  }
  const web = value.match(
    /^(?:https?:\/\/)?((?:[\w-]+\.)+[a-z]{2,})\/([\w.-]+(?:\/[\w.-]+)+?)(?:\.git)?\/?$/i,
  );
  if (!web) return null;
  const [, host, path] = web;
  // On GitHub a repository is always owner/name; anything after it is a page
  // inside the repository (/tree/main, /settings). GitLab nests groups.
  const repoPath =
    host.toLowerCase() === "github.com"
      ? path
          .split("/")
          .slice(0, 2)
          .join("/")
          .replace(/\.git$/, "")
      : path;
  return repoPath.includes("/") ? `git@${host}:${repoPath}.git` : null;
};

export const repoUrlOf = (env) =>
  (env?.git_repository || env?.gitRepository)?.url || "";

// The page where a deploy key is added, for a github.com address in any form
// the wizard accepts (git@github.com:o/r.git, ssh://git@github.com/o/r,
// https://github.com/o/r). Null for other hosts: there is no address to build.
export const deployKeysLink = (repoUrl = "") => {
  const match = String(repoUrl)
    .trim()
    .match(
      /^(?:https:\/\/|ssh:\/\/)?(?:git@)?github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i,
    );
  if (!match) return null;
  const [, owner, repo] = match;
  return {
    href: `https://github.com/${owner}/${repo}/settings/keys/new`,
    label: `Open deploy keys for ${owner}/${repo}`,
  };
};

// The three parts of the AWS connect dialog. Progress only moves forward: a
// user who opened CloudShell by hand and copied the command has done both.
export const awsPoints = ({ opened, copied, parsed } = {}) => [
  {
    label: "Open the AWS terminal",
    target: "aws-open-cloudshell",
    text: "Click here. AWS opens in a new tab. Sign in, and a terminal called CloudShell opens at the bottom of the page.",
    done: Boolean(opened || copied || parsed),
  },
  {
    label: "Copy the command and run it",
    target: "aws-copy-command",
    text: "Copy the command, paste it into the AWS terminal and press Enter. When it finishes, it prints one line that starts with openprime:",
    done: Boolean(copied || parsed),
  },
  parsed
    ? {
        label: "Paste the line it prints",
        target: "aws-connect",
        text: "Your AWS account is recognized. Click Connect.",
        done: false,
      }
    : {
        label: "Paste the line it prints",
        target: "aws-paste-line",
        text: "Paste that line here and click Connect. Your AWS account number shows up when it worked.",
        done: false,
      },
];

// What matters in the wizard, in the order it is done. Name, repository and
// key are all in its first part.
export const wizardPoints = (wizard) => [
  {
    label: "Name it",
    part: 1,
    target: "wizard-name",
    text: "Type a short name, for example production.",
    done: Boolean(wizard.name?.trim()),
  },
  {
    label: "Paste your repository address",
    part: 1,
    target: "wizard-repo-url",
    text: "Paste your repository's SSH address. It starts with git@github.com:",
    done: Boolean(wizard.repoUrl?.trim()),
  },
  {
    label: "Add the key on GitHub",
    part: 1,
    target: "wizard-public-key",
    text: "Copy this key. Open your repository's deploy keys, paste it and tick Allow write access.",
    link: deployKeysLink(wizard.repoUrl),
    done: Boolean(wizard.keyCopied || wizard.keyEntered),
  },
  {
    label: "Click Create Environment",
    part: null,
    target: "wizard-next",
    text:
      wizard.part < wizard.partCount
        ? "Click Continue. In the next parts pick what you need. Create Environment is at the end."
        : "Click Create Environment.",
    done: false,
  },
];

export const pushPoint = (env) =>
  repoUrlOf(env)
    ? {
        label: "Click Push to Git",
        target: "push-button",
        text: "Click Push to Git. OpenPrime writes the code and sends it to your repository. This step ticks itself when the push succeeds.",
      }
    : {
        label: "Add a repository",
        target: "edit-button",
        text: "This environment has no repository yet. Click Edit and switch on Git Repository in the first part of the form.",
      };

// Where a point is when it is not on the current part of the wizard.
export const whereHint = (point, wizard) =>
  point?.part && wizard && wizard.part !== point.part
    ? `This is in part ${point.part} of the form. Go back with Previous.`
    : null;
