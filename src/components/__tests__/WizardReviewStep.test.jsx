import { render, screen } from "@testing-library/react";
import WizardReviewStep from "../WizardReviewStep";

const baseEnv = {
  name: "demo",
  globalPrefix: "demo-",
  provider: "aws",
  region: "eu-west-1",
  services: {},
};

const renderStep = (env) =>
  render(<WizardReviewStep newEnv={env} onEditStep={() => {}} />);

describe("WizardReviewStep readiness gates", () => {
  it("warns when Kubernetes/Helm charts are enabled without a Git repository URL", () => {
    renderStep({
      ...baseEnv,
      services: {
        eks: {
          enabled: true,
          helmCharts: {
            ingressNginx: { enabled: true },
          },
        },
      },
      gitRepository: { enabled: false },
    });

    expect(
      screen.getByText(
        /Git repository URL is required when using Kubernetes\/Helm charts/,
      ),
    ).toBeInTheDocument();
  });

  it("warns when a Git repository URL is set without an SSH key", () => {
    renderStep({
      ...baseEnv,
      gitRepository: {
        enabled: true,
        url: "git@github.com:openprime/demo-infra.git",
        branch: "main",
        sshKey: "",
      },
    });

    expect(
      screen.getByText(
        /An SSH key is required when a Git repository URL is set/,
      ),
    ).toBeInTheDocument();
  });

  it("warns when Terraform backend is enabled without an S3 bucket name", () => {
    renderStep({
      ...baseEnv,
      terraformBackend: {
        enabled: true,
        bucketName: "",
      },
    });

    expect(
      screen.getByText(
        /S3 bucket name is required when Terraform backend is enabled/,
      ),
    ).toBeInTheDocument();
  });

  it("shows no warnings when all required fields are coherent", () => {
    renderStep({
      ...baseEnv,
      services: {
        eks: {
          enabled: true,
          helmCharts: {
            ingressNginx: { enabled: true },
          },
        },
      },
      gitRepository: {
        enabled: true,
        url: "git@github.com:openprime/demo-infra.git",
        branch: "main",
        sshKey:
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDEMOkeyForOpenPrimeDemoEnvironmentNotARealKey deploy@openprime",
      },
      terraformBackend: {
        enabled: true,
        bucketName: "demo-tf-state",
      },
    });

    expect(
      screen.queryByText(/Git repository URL is required/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/An SSH key is required/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/S3 bucket name is required/i),
    ).not.toBeInTheDocument();
  });
});
