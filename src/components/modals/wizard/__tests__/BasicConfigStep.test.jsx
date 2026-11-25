import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import BasicConfigStep, { GLOBAL_PREFIX_RE } from "../BasicConfigStep";
import { ToastProvider } from "../../../../contexts/ToastContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSshKeyGeneration } from "../../../wizard-page/useSshKeyGeneration";

// Stateful harness: BasicConfigStep is controlled (newEnv / setNewEnv), so the
// toggles need a real state owner to re-render on change — mirrors the wizard.
function Harness({ initial }) {
  const [newEnv, setNewEnv] = useState(initial);
  const sshKeys = useSshKeyGeneration({
    newEnv,
    setNewEnv,
    active: true,
    identity: "test",
  });
  return (
    <MemoryRouter>
      <TooltipProvider>
        <ToastProvider>
          <BasicConfigStep
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            sshKeys={sshKeys}
          />
        </ToastProvider>
      </TooltipProvider>
    </MemoryRouter>
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
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Resource prefix")).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Cloud provider" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Region")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Terraform state backend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Git repository" }),
    ).toBeInTheDocument();
  });

  it("loads cloud credentials from the API (MSW) for the selected provider", async () => {
    renderStep();
    expect(await screen.findByText(/aws-sandbox/)).toBeInTheDocument();
  });

  it("reveals the Terraform Backend config when its toggle is enabled", () => {
    renderStep();
    expect(
      screen.queryByRole("radio", { name: /Create a new bucket/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /state backend/i }));
    expect(
      screen.getByRole("radio", { name: /Create a new bucket/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Use an existing bucket/ }),
    ).toBeInTheDocument();
  });

  // The two bucket choices carry a picture, like the cloud provider cards:
  // the S3 icon, with a plus for a new bucket and a link for an existing one.
  it("pictures the new and the existing bucket", () => {
    renderStep();
    fireEvent.click(screen.getByRole("switch", { name: /state backend/i }));
    const art = (name) =>
      screen
        .getByRole("radio", { name })
        .closest("label")
        .querySelector('[aria-hidden="true"]');
    for (const [name, badge] of [
      [/Create a new bucket/, "lucide-plus"],
      [/Use an existing bucket/, "lucide-link"],
    ]) {
      expect(art(name).querySelector("img")).not.toBeNull();
      expect(art(name).querySelector("svg")).toHaveClass(badge);
    }
  });

  it("reveals the Git Repository config when its toggle is enabled", () => {
    renderStep();
    expect(screen.queryByText("Repository URL")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /git repository/i }));
    expect(screen.getByText("Repository URL")).toBeInTheDocument();
    expect(screen.getByText(/SSH private key/i)).toBeInTheDocument();
  });

  // Guards OP-182: a provider with no provisioning path must not be selectable.
  // Only AWS has templates/terraform; on-premise has none, so it may be visible
  // as roadmap but never clickable.
  it("offers AWS as the only selectable provider and marks the rest as roadmap", () => {
    renderStep();
    const aws = screen.getByRole("radio", { name: /AWS/ });
    expect(aws).toBeEnabled();
    expect(aws).toBeChecked();

    const onPrem = screen.getByRole("radio", { name: /On-premises/ });
    expect(onPrem).toBeDisabled();
    expect(within(onPrem.closest("label")).getByText("Roadmap")).toBeVisible();
  });

  // Guards OP-256: nothing reads the industry/standards presets yet, so they may
  // be visible as roadmap but never clickable: disabled tiles, no buttons.
  it("shows the industry and standards presets as roadmap, never clickable", () => {
    renderStep();
    const section = screen.getByRole("region", {
      name: "Industry and compliance presets",
    });
    const list = within(section).getByRole("list");
    const tiles = within(list).getAllByRole("listitem");
    expect(tiles).toHaveLength(8);
    expect(within(section).queryAllByRole("button")).toHaveLength(0);
    // Each tile says it is on the roadmap, with its own icon.
    for (const tile of tiles) {
      expect(within(tile).getByText("Roadmap")).toBeInTheDocument();
      expect(tile.querySelector("svg.lucide")).not.toBeNull();
    }
  });

  // Announced as unavailable (a disabled control), and a click selects
  // nothing.
  it("cannot select a preset", () => {
    renderStep();
    const section = screen.getByRole("region", {
      name: "Industry and compliance presets",
    });
    const presets = within(section).getAllByRole("checkbox");
    expect(presets.map((p) => p.closest("label").textContent)).toEqual([
      "HealthcareRoadmap",
      "E-commerceRoadmap",
      "FintechRoadmap",
      "DefenceRoadmap",
      "StartupRoadmap",
      "ISO 27001Roadmap",
      "DORARoadmap",
      "NIS2Roadmap",
    ]);
    for (const preset of presets) {
      expect(preset).toBeDisabled();
      fireEvent.click(preset.closest("label"));
      expect(preset).not.toBeChecked();
    }
  });

  // The Review step summarises the configuration; Basics no longer repeats it.
  it("has no ready-to-create summary box", () => {
    renderStep();
    expect(screen.queryByText(/Ready to create/)).not.toBeInTheDocument();
  });

  // The name keeps only lowercase letters and numbers (backend contract); a
  // dropped keystroke is said, not silently swallowed.
  it("says when the name leaves out a typed character", () => {
    renderStep({ ...awsEnv, name: "" });
    const name = screen.getByLabelText("Name");
    const hint = screen.getByText(
      "Lowercase letters and numbers, no hyphens, e.g. production.",
    );
    expect(hint).toHaveAttribute("aria-live", "polite");

    fireEvent.change(name, { target: { value: "audit-" } });
    expect(name).toHaveValue("audit");
    expect(hint).toHaveTextContent(
      "Hyphens, spaces and symbols are not allowed in the name.",
    );

    fireEvent.change(name, { target: { value: "auditenv" } });
    expect(hint).toHaveTextContent(
      "Lowercase letters and numbers, no hyphens, e.g. production.",
    );
  });

  describe("Global Prefix auto-suggest", () => {
    const blankEnv = { ...awsEnv, name: "", globalPrefix: "" };

    it("suggests a dash-suffixed prefix as the name is typed", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText("e.g. production");
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(nameInput, { target: { value: "demo" } });

      expect(nameInput).toHaveValue("demo");
      expect(prefixInput).toHaveValue("demo-");
    });

    it("keeps the prefix in sync while the name keeps changing", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText("e.g. production");
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(nameInput, { target: { value: "demo" } });
      fireEvent.change(nameInput, { target: { value: "demoapp" } });

      expect(prefixInput).toHaveValue("demoapp-");
    });

    it("stops auto-syncing once the prefix has been edited by hand", () => {
      renderStep(blankEnv);
      const nameInput = screen.getByPlaceholderText("e.g. production");
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

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
      const nameInput = screen.getByPlaceholderText("e.g. production");
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(nameInput, { target: { value: "demoapp" } });

      expect(prefixInput).toHaveValue("custom-");
    });

    it("keeps internal dashes when hand-editing the prefix", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

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
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(prefixInput, { target: { value: "app_testing-" } });
      expect(prefixInput).toHaveValue("apptesting-");

      fireEvent.change(prefixInput, { target: { value: "us_app_test-" } });
      expect(prefixInput).toHaveValue("usapptest-");
    });

    it("still strips unsupported characters and always auto-appends a trailing dash", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(prefixInput, { target: { value: "App!Test 1" } });
      expect(prefixInput).toHaveValue("apptest1-");
    });

    // Regression: the cursor defaults to the end of the field (e.g. right
    // after clicking/tabbing in), which sits *after* the auto-appended
    // trailing dash. Typing there must land the new characters before the
    // dash, not append a fresh dash after every keystroke.
    it("keeps typing before the trailing dash when the cursor sits at the end", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      for (const ch of "apptesting") {
        const raw = prefixInput.value + ch;
        fireEvent.change(prefixInput, { target: { value: raw } });
      }

      expect(prefixInput).toHaveValue("apptesting-");
    });

    // OP-231: the field always shows a trailing dash, cosmetic unless the
    // user's own last keystroke put a real one there - the two are the same
    // string ("app-" either way), so telling them apart needs a bit of
    // state beyond the input value (trailingDashIsRealRef in
    // BasicConfigStep). Without it, a dash typed at the end used to be
    // mistaken for the auto-dash and silently eaten.
    it("accepts a dash typed one character at a time", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      for (const ch of "app-testing") {
        const raw = prefixInput.value + ch;
        fireEvent.change(prefixInput, { target: { value: raw } });
      }

      expect(prefixInput).toHaveValue("app-testing-");
    });

    // A second dash typed immediately after the first is a no-op rather
    // than growing into "app--" - RDS/Aurora identifiers and ElastiCache
    // replication group ids both reject two consecutive hyphens.
    it("does not grow a double hyphen when a dash is typed twice in a row", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      for (const ch of "app--test") {
        const raw = prefixInput.value + ch;
        fireEvent.change(prefixInput, { target: { value: raw } });
      }

      expect(prefixInput).toHaveValue("app-test-");
    });

    // RDS/Aurora identifiers and ElastiCache replication group ids both
    // reject a leading digit.
    it("strips a leading digit, which RDS/Aurora/ElastiCache reject", () => {
      renderStep(blankEnv);
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      fireEvent.change(prefixInput, { target: { value: "2024-app" } });
      expect(prefixInput).toHaveValue("app-");
    });

    // Acceptance criteria: a prefix the wizard accepts must always be one
    // the backend and AWS accept too - assert every produced value against
    // the canonical charset shared with environmentValidator.js and the
    // terraform templates, not just spot-checked examples above.
    it.each([
      ["myapp-", "myapp-"],
      ["app_testing-", "apptesting-"],
      ["App!Test 1", "apptest1-"],
      ["2024-app", "app-"],
      ["--app--", "app-"],
    ])(
      "always produces a value matching the canonical charset (%p)",
      (input) => {
        renderStep(blankEnv);
        const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

        fireEvent.change(prefixInput, { target: { value: input } });
        expect(
          prefixInput.value === "" || GLOBAL_PREFIX_RE.test(prefixInput.value),
        ).toBe(true);
      },
    );

    // Regression: deleting a character out of the middle of the prefix used
    // to be ignored entirely - the handler always chopped the *last*
    // character off the old value instead of respecting where the
    // deletion actually happened.
    it("deletes the character that was actually removed, not the last one", () => {
      renderStep({ ...awsEnv, name: "", globalPrefix: "abcdef-" });
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      // Simulates removing "c" from the middle: caret-correct native value.
      fireEvent.change(prefixInput, { target: { value: "abdef-" } });
      expect(prefixInput).toHaveValue("abdef-");
    });

    it("still removes one real character per backspace at the end, despite the auto-dash", () => {
      renderStep({ ...awsEnv, name: "", globalPrefix: "app-" });
      const prefixInput = screen.getByPlaceholderText("e.g. myapp-");

      // First backspace removes the trailing dash itself...
      fireEvent.change(prefixInput, { target: { value: "app" } });
      expect(prefixInput).toHaveValue("ap-");

      // ...second backspace removes a real character, not the dash again.
      fireEvent.change(prefixInput, { target: { value: "ap" } });
      expect(prefixInput).toHaveValue("a-");
    });
  });
});
