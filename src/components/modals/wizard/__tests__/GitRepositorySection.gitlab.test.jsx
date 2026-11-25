import { fireEvent, render, screen } from "@testing-library/react";
import GitRepositorySection from "../basic-config/GitRepositorySection";

// OP-250 / OP-251: the GitLab walk (OP-248) hit two GitLab-only prerequisites
// the callout never mentioned — gitlab.com identity verification before the
// first pipeline, and CI/CD variables that are protected by default and so
// never reach an unprotected deploy branch.
const envWithRepo = (url) => ({
  gitRepository: {
    enabled: true,
    url,
    branch: "infra",
    sshKey: "",
  },
});

// SshKeyTabs needs a controller; these tests only read the callout.
const sshKeys = {
  mode: "manual",
  status: "idle",
  pair: null,
  error: "",
  isSelected: false,
  setMode: vi.fn(),
  setManualKey: vi.fn(),
  generate: vi.fn(),
  useGeneratedKey: vi.fn(),
};

// The notes live in the closed "What your CI needs" disclosure: open it first,
// so an absent note means absent, not merely collapsed.
const renderWith = (url) => {
  render(
    <GitRepositorySection
      newEnv={envWithRepo(url)}
      setNewEnv={() => {}}
      sshKeys={sshKeys}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /what your ci needs/i }));
};

const protectedNote = () => screen.queryByText(/protected by default/i);
const verificationNote = () => screen.queryByText(/verify their identity/i);

describe("GitRepositorySection — GitLab prerequisites", () => {
  it("keeps the CI prerequisites closed until asked for", () => {
    render(
      <GitRepositorySection
        newEnv={envWithRepo("git@gitlab.com:acme/infra.git")}
        setNewEnv={() => {}}
        sshKeys={sshKeys}
      />,
    );
    expect(
      screen.getByRole("button", { name: /what your ci needs/i }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(protectedNote()).not.toBeInTheDocument();
  });

  it("shows no GitLab notes for a GitHub repository", () => {
    renderWith("git@github.com:acme/infra.git");
    expect(protectedNote()).not.toBeInTheDocument();
    expect(verificationNote()).not.toBeInTheDocument();
  });

  it("shows both notes for a gitlab.com SSH URL", () => {
    renderWith("git@gitlab.com:acme/infra.git");
    expect(protectedNote()).toBeInTheDocument();
    expect(verificationNote()).toBeInTheDocument();
  });

  it("shows both notes for a gitlab.com HTTPS URL", () => {
    renderWith("https://gitlab.com/acme/infra.git");
    expect(protectedNote()).toBeInTheDocument();
    expect(verificationNote()).toBeInTheDocument();
  });

  it("shows only the protected-variables note for a self-hosted GitLab", () => {
    // Identity verification is a gitlab.com SaaS rule; self-hosted instances
    // do not have it, but they do protect variables by default.
    renderWith("ssh://git@gitlab.example.sk:3522/acme/infra.git");
    expect(protectedNote()).toBeInTheDocument();
    expect(verificationNote()).not.toBeInTheDocument();
  });

  // One rule decides GitLab, the one that picks the logo: a host naming
  // both is GitHub, so no GitLab notes next to the GitHub logo.
  it("follows the provider logo for a host that names both", () => {
    renderWith("git@github-gitlab-mirror.example.com:acme/infra.git");
    expect(protectedNote()).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="logo-tile"] img'),
    ).toHaveAttribute("src", "/assets/chart-logos/github.svg");
  });

  it("shows no GitLab notes before a URL is entered", () => {
    renderWith("");
    expect(protectedNote()).not.toBeInTheDocument();
    expect(verificationNote()).not.toBeInTheDocument();
  });
});
