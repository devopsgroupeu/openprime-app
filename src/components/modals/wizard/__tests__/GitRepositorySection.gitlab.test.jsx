import { render, screen } from "@testing-library/react";
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

const renderWith = (url) =>
  render(
    <GitRepositorySection newEnv={envWithRepo(url)} setNewEnv={() => {}} />,
  );

const protectedNote = () => screen.queryByText(/protected by default/i);
const verificationNote = () => screen.queryByText(/verify their identity/i);

describe("GitRepositorySection — GitLab prerequisites", () => {
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

  it("shows no GitLab notes before a URL is entered", () => {
    renderWith("");
    expect(protectedNote()).not.toBeInTheDocument();
    expect(verificationNote()).not.toBeInTheDocument();
  });
});
