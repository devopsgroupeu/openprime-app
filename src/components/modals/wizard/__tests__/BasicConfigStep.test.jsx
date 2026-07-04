import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState } from "react";
import BasicConfigStep from "../BasicConfigStep";
import { ToastProvider } from "../../../../contexts/ToastContext";

// Stateful harness: BasicConfigStep is controlled (newEnv / setNewEnv), so the
// toggles need a real state owner to re-render on change — mirrors the wizard.
function Harness({ initial }) {
  const [newEnv, setNewEnv] = useState(initial);
  return (
    <ToastProvider>
      <BasicConfigStep newEnv={newEnv} setNewEnv={setNewEnv} />
    </ToastProvider>
  );
}

const awsEnv = {
  name: "production",
  globalPrefix: "myapp-",
  provider: "aws",
  region: "eu-west-1",
  cloudCredentialId: null,
  terraformBackend: { enabled: false },
  gitRepository: { enabled: false },
};

const renderStep = (initial = awsEnv) => render(<Harness initial={initial} />);

describe("BasicConfigStep", () => {
  it("renders all config sections for an AWS environment", () => {
    renderStep();
    expect(screen.getByText("Environment Name")).toBeInTheDocument();
    expect(screen.getByText("Global Prefix")).toBeInTheDocument();
    expect(screen.getByText("Cloud Provider")).toBeInTheDocument();
    expect(screen.getByText("Deployment Region")).toBeInTheDocument();
    expect(screen.getByText(/Terraform Backend/)).toBeInTheDocument();
    expect(screen.getByText(/Git Repository/)).toBeInTheDocument();
  });

  it("loads cloud credentials from the API (MSW) for the selected provider", async () => {
    renderStep();
    expect(await screen.findByText(/aws-sandbox/)).toBeInTheDocument();
  });

  it("reveals the Terraform Backend config when its toggle is enabled", () => {
    renderStep();
    expect(
      screen.queryByText("S3 Bucket Configuration"),
    ).not.toBeInTheDocument();
    // toggles order: [0] Terraform Backend, [1] Git Repository
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByText("S3 Bucket Configuration")).toBeInTheDocument();
    expect(screen.getByText("Create New Bucket")).toBeInTheDocument();
  });

  it("reveals the Git Repository config when its toggle is enabled", () => {
    renderStep();
    expect(screen.queryByText("Repository URL")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(screen.getByText("Repository URL")).toBeInTheDocument();
    expect(screen.getByText(/SSH Private Key/)).toBeInTheDocument();
  });

  it("shows the ready-to-create summary once name/prefix/provider/region are set", () => {
    renderStep();
    const summary = screen.getByText(/Ready to create/);
    expect(within(summary).getByText(/production/)).toBeInTheDocument();
  });
});
