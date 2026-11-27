// What the setup guide says (OP-283). Written for someone without a technical
// background: one sentence per step and one button. Steps that happen inside
// OpenPrime are split into "points": one thing to do, the element it is done on
// (its data-guide name, which the highlight rings) and the sentence shown next
// to it. Pure functions, so the dock and its tests read the same table.

import { deployKeysLink } from "../../utils/repoAddress";

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
      "Your repository's pipeline builds everything in your AWS account. It is set up, started and approved on GitHub; the guide has every link and value ready.",
    doneText: "Deployment started.",
  },
};

export const GITHUB_NEW_REPO_URL = "https://github.com/new";

export const repoUrlOf = (env) =>
  (env?.git_repository || env?.gitRepository)?.url || "";

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

// What matters in the wizard, in the order it is done. Name, state storage,
// repository and key are all in its first part.
export const wizardPoints = (wizard) => {
  const deployKeys = deployKeysLink(wizard.repoUrl);
  return [
    {
      label: "Name it",
      part: 1,
      target: "wizard-name",
      text: "Type a short name, for example production.",
      done: Boolean(wizard.name?.trim()),
    },
    // The pipeline refuses to run without a remote state backend
    // (templates/.github/scripts/check-backend.sh). The bucket is named after
    // the environment, so it comes right after the name.
    {
      label: "Create the state storage",
      part: 1,
      target: "wizard-create-backend",
      text: "Click Create Backend Resources. OpenPrime makes a private S3 bucket in your AWS account where Terraform keeps track of what it built. The pipeline cannot run without it.",
      done: Boolean(wizard.backendReady),
    },
    {
      label: "Paste your repository address",
      part: 1,
      target: "wizard-repo-url",
      text: "Paste your repository's SSH address. It starts with git@github.com:",
      done: Boolean(wizard.repoUrl?.trim()),
    },
    {
      label: "Copy the key",
      part: 1,
      target: "wizard-public-key",
      text: "Copy this key with the copy button. Next, you add it to your repository on GitHub.",
      done: Boolean(wizard.keyCopied || wizard.keyEntered),
    },
    // Only where the page that takes the key can be linked (github.com). The
    // guide cannot see GitHub, so opening that page counts as done.
    ...(deployKeys
      ? [
          {
            label: "Add it on GitHub",
            part: 1,
            target: "wizard-deploy-keys-link",
            text: "This opens the page on GitHub where the key goes. Paste the key, tick Allow write access and click Add key. Without write access, OpenPrime cannot send your code to the repository.",
            link: deployKeys,
            done: Boolean(wizard.deployKeysOpened || wizard.keyEntered),
          },
        ]
      : []),
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
};

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
