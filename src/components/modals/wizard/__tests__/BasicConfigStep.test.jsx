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

  // Guards OP-182: a provider with no provisioning path must not be selectable.
  // Only AWS has templates/terraform; on-premise has none, so it may be visible
  // as roadmap but never clickable.
  it("offers AWS as the only selectable provider and marks the rest as roadmap", () => {
    renderStep();
    const aws = screen.getByRole("button", { name: /Amazon Web Services/ });
    expect(aws).toBeEnabled();

    const onPrem = screen.getByRole("button", { name: /On-Premise/ });
    expect(onPrem).toBeDisabled();
    expect(within(onPrem).getByText("Roadmap")).toBeInTheDocument();
  });

  it("shows the ready-to-create summary once name/prefix/provider/region are set", () => {
    renderStep();
    const summary = screen.getByText(/Ready to create/);
    expect(within(summary).getByText(/production/)).toBeInTheDocument();
  });

  describe("Global Prefix auto-suggest", () => {
    const blankEnv = { ...awsEnv, name: "", globalPrefix: "" };

    it("suggests a dash-suffixed prefix as the name is typed", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText(
        /e.g., production, staging, development/,
      );
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(nameInput, { target: { value: "demo" } });

      expect(nameInput).toHaveValue("demo");
      expect(prefixInput).toHaveValue("demo-");
    });

    it("keeps the prefix in sync while the name keeps changing", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText(
        /e.g., production, staging, development/,
      );
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(nameInput, { target: { value: "demo" } });
      fireEvent.change(nameInput, { target: { value: "demoapp" } });

      expect(prefixInput).toHaveValue("demoapp-");
    });

    it("stops auto-syncing once the prefix has been edited by hand", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText(
        /e.g., production, staging, development/,
      );
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(nameInput, { target: { value: "demo" } });
      expect(prefixInput).toHaveValue("demo-");

      // Manual edit - user takes over the prefix.
      fireEvent.change(prefixInput, { target: { value: "custom" } });
      expect(prefixInput).toHaveValue("custom-");

      // Further name changes must no longer touch the prefix.
      fireEvent.change(nameInput, { target: { value: "demoapp" } });
      expect(nameInput).toHaveValue("demoapp");
      expect(prefixInput).toHaveValue("custom-");
    });

    it("does not overwrite an already-customized prefix loaded from a draft", () => {
      renderStep({ ...awsEnv, name: "demo", globalPrefix: "custom-" });
      const nameInput = screen.getByPlaceholderText(
        /e.g., production, staging, development/,
      );
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(nameInput, { target: { value: "demoapp" } });

      expect(prefixInput).toHaveValue("custom-");
    });

    it("keeps internal dashes when hand-editing the prefix", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(prefixInput, { target: { value: "app-testing-" } });
      expect(prefixInput).toHaveValue("app-testing-");

      fireEvent.change(prefixInput, { target: { value: "prod-app-" } });
      expect(prefixInput).toHaveValue("prod-app-");

      fireEvent.change(prefixInput, { target: { value: "us-app-test-" } });
      expect(prefixInput).toHaveValue("us-app-test-");
    });

    // The backend rejects underscores (environmentValidator.js:
    // /^[A-Za-z0-9][A-Za-z0-9-]{0,62}$/), and raw prefixes reach S3 bucket
    // names and RDS/Aurora/ElastiCache identifiers, which AWS rejects at
    // apply. Stripping here keeps the field unable to produce a value that
    // fails later. See OP-231 for agreeing one charset across all layers.
    it("strips underscores, which the backend and AWS both reject", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(prefixInput, { target: { value: "app_testing-" } });
      expect(prefixInput).toHaveValue("apptesting-");

      fireEvent.change(prefixInput, { target: { value: "us_app_test-" } });
      expect(prefixInput).toHaveValue("usapptest-");
    });

    it("still strips unsupported characters and always auto-appends a trailing dash", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      fireEvent.change(prefixInput, { target: { value: "App!Test 1" } });
      expect(prefixInput).toHaveValue("apptest1-");
    });

    // Regression: the cursor defaults to the end of the field (e.g. right
    // after clicking/tabbing in), which sits *after* the auto-appended
    // trailing dash. Typing there must land the new characters before the
    // dash, not append a fresh dash after every keystroke.
    it("keeps typing before the trailing dash when the cursor sits at the end", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      for (const ch of "apptesting") {
        const raw = prefixInput.value + ch;
        fireEvent.change(prefixInput, { target: { value: raw } });
      }

      expect(prefixInput).toHaveValue("apptesting-");
    });

    // Known limitation, pinned deliberately rather than left to be
    // rediscovered: the field always shows an auto-appended trailing dash,
    // so a dash typed at the end is indistinguishable from it and
    // `replace(/-+$/, "")` removes it. Internal dashes therefore survive
    // paste and hand-editing (covered above) but not sequential typing.
    // Distinguishing the two needs state beyond the input value - OP-231.
    it("cannot yet accept a dash typed one character at a time", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      for (const ch of "app-testing") {
        const raw = prefixInput.value + ch;
        fireEvent.change(prefixInput, { target: { value: raw } });
      }

      expect(prefixInput).toHaveValue("apptesting-");
    });

    // Regression: deleting a character out of the middle of the prefix used
    // to be ignored entirely - the handler always chopped the *last*
    // character off the old value instead of respecting where the
    // deletion actually happened.
    it("deletes the character that was actually removed, not the last one", () => {
      renderStep({ ...awsEnv, name: "", globalPrefix: "abcdef-" });
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      // Simulates removing "c" from the middle: caret-correct native value.
      fireEvent.change(prefixInput, { target: { value: "abdef-" } });
      expect(prefixInput).toHaveValue("abdef-");
    });

    it("still removes one real character per backspace at the end, despite the auto-dash", () => {
      renderStep({ ...awsEnv, name: "", globalPrefix: "app-" });
      const prefixInput = screen.getByPlaceholderText(
        /e.g., myapp-, prod-, us-app-, app-test-/,
      );

      // First backspace removes the trailing dash itself...
      fireEvent.change(prefixInput, { target: { value: "app" } });
      expect(prefixInput).toHaveValue("ap-");

      // ...second backspace removes a real character, not the dash again.
      fireEvent.change(prefixInput, { target: { value: "ap" } });
      expect(prefixInput).toHaveValue("a-");
    });
  });
});
