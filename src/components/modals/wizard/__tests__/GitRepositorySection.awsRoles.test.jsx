import { render, screen } from "@testing-library/react";
import GitRepositorySection from "../basic-config/GitRepositorySection";

// OP-265: the generated pipeline signs in to AWS with roles created by
// terraform/bootstrap (OIDC), so the callout must ask for the three role
// variables and no longer for AWS access keys.
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
])("GitRepositorySection — AWS roles (%s)", (url) => {
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

  it("lists the three role variables", () => {
    for (const name of [
      "AWS_PLAN_ROLE_ARN",
      "AWS_APPLY_ROLE_ARN",
      "AWS_DESTROY_ROLE_ARN",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("points to the one-time bootstrap", () => {
    expect(screen.getByText("terraform/bootstrap")).toBeInTheDocument();
  });

  it("no longer asks for AWS access keys", () => {
    expect(screen.queryByText("AWS_ACCESS_KEY_ID")).not.toBeInTheDocument();
    expect(screen.queryByText("AWS_SECRET_ACCESS_KEY")).not.toBeInTheDocument();
  });
});
