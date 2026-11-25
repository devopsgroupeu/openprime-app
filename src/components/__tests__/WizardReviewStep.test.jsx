import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
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

describe("WizardReviewStep summary", () => {
  it("lists Basics problems first and links to the step", () => {
    const onEditStep = vi.fn();
    render(
      <WizardReviewStep
        newEnv={{ ...baseEnv, name: "" }}
        onEditStep={onEditStep}
        problems={[
          { field: "name", message: "Enter a name for this environment." },
        ]}
      />,
    );
    const callout = screen.getByText("Basics needs attention.").parentElement;
    expect(callout).toHaveTextContent("Enter a name for this environment.");
    fireEvent.click(screen.getAllByRole("button", { name: "Go to Basics" })[0]);
    expect(onEditStep).toHaveBeenCalledWith("basic");
  });

  it("lists service problems with a link to Services", () => {
    const onEditStep = vi.fn();
    render(
      <WizardReviewStep
        newEnv={{ ...baseEnv, services: { eks: { enabled: true } } }}
        onEditStep={onEditStep}
        serviceProblems={[
          { field: "eks", message: "EKS requires VPC to be enabled" },
        ]}
      />,
    );
    const callout = screen.getByText("Services need attention.").parentElement;
    expect(callout).toHaveTextContent("EKS requires VPC to be enabled");
    fireEvent.click(screen.getByRole("button", { name: "Go to Services" }));
    expect(onEditStep).toHaveBeenCalledWith("services");
  });

  // A summary present whenever Review opens, not an event: no alert, so it
  // does not talk over the step heading on every visit.
  it("does not announce its problem lists as alerts", () => {
    render(
      <WizardReviewStep
        newEnv={{ ...baseEnv, name: "", services: { eks: { enabled: true } } }}
        onEditStep={() => {}}
        problems={[
          { field: "name", message: "Enter a name for this environment." },
        ]}
        serviceProblems={[
          { field: "eks", message: "EKS requires VPC to be enabled" },
        ]}
      />,
    );

    expect(screen.getByText("Basics needs attention.")).toBeInTheDocument();
    expect(screen.getByText("Services need attention.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows each step with an Edit that jumps back to it", () => {
    const onEditStep = vi.fn();
    render(
      <WizardReviewStep
        newEnv={{
          ...baseEnv,
          services: {
            vpc: { enabled: true },
            eks: { enabled: true, helmCharts: { loki: { enabled: true } } },
          },
        }}
        onEditStep={onEditStep}
      />,
    );
    expect(screen.getByText("Resource prefix")).toBeInTheDocument();
    expect(screen.getByText("Loki")).toBeInTheDocument();
    // Empty values read "-", never an em dash.
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Edit helm charts" }));
    expect(onEditStep).toHaveBeenCalledWith("helm");
  });
});
