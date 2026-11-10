import { render, screen } from "@testing-library/react";
import GitRepositorySection from "../basic-config/GitRepositorySection";

// OP-265: Argo CD only pulls the repository, so TF_VAR_git_repo_ssh_key must
// hold a separate read-only deploy key, not the write key OpenPrime pushes with.
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

describe.each([
  "git@github.com:acme/infra.git",
  "git@gitlab.com:acme/infra.git",
])("GitRepositorySection — Argo CD key (%s)", (url) => {
  beforeEach(() => {
    render(
      <GitRepositorySection
        newEnv={{
          gitRepository: { enabled: true, url, branch: "main", sshKey: "" },
        }}
        setNewEnv={() => {}}
        sshKeys={sshKeys}
      />,
    );
  });

  it("asks for a separate read-only key", () => {
    expect(
      screen.getByText(/second, read-only deploy key/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/do not reuse the key above/i)).toBeInTheDocument();
  });

  it("shows how to create it", () => {
    expect(
      screen.getByText(/ssh-keygen -t ed25519 -N "" -f argocd-deploy-key/),
    ).toBeInTheDocument();
  });

  it("no longer tells the customer to reuse the push key", () => {
    expect(
      screen.queryByText(/used by Terraform and ArgoCD/i),
    ).not.toBeInTheDocument();
  });
});
