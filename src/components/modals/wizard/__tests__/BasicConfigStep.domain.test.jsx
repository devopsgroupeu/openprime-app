import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import BasicConfigStep from "../BasicConfigStep";
import { ToastProvider } from "../../../../contexts/ToastContext";

// OP-244: generated environments used to publish openprime.io — our domain in
// the customer's account, which left ArgoCD without a certificate and therefore
// without an address. The domain is now a top-level environment field, and
// unlike name and global prefix it stays editable after creation.
function Harness({ initial, isEditMode = false }) {
  const [newEnv, setNewEnv] = useState(initial);
  return (
    <ToastProvider>
      <BasicConfigStep
        newEnv={newEnv}
        setNewEnv={setNewEnv}
        isEditMode={isEditMode}
        validationErrors={[]}
      />
    </ToastProvider>
  );
}

const awsEnv = {
  name: "production",
  globalPrefix: "myapp-",
  provider: "aws",
  region: "eu-west-1",
  domain: "",
  cloudCredentialId: null,
  terraformBackend: { enabled: false },
  gitRepository: { enabled: false },
};

const domainInput = () => screen.getByPlaceholderText("e.g., example.com");

describe("BasicConfigStep — domain (OP-244)", () => {
  it("renders the domain field", () => {
    render(<Harness initial={awsEnv} />);
    expect(screen.getByText("Domain (Optional)")).toBeInTheDocument();
    expect(domainInput()).toHaveValue("");
  });

  it("accepts a typed domain", () => {
    render(<Harness initial={awsEnv} />);
    fireEvent.change(domainInput(), { target: { value: "example.com" } });
    expect(domainInput()).toHaveValue("example.com");
  });

  it("stays editable in edit mode, unlike name and global prefix", () => {
    render(
      <Harness initial={{ ...awsEnv, domain: "old.example.com" }} isEditMode />,
    );

    // The two locked fields, for contrast — this is the whole point of the test.
    expect(screen.getByPlaceholderText(/e\.g\., production/)).toBeDisabled();
    expect(screen.getByPlaceholderText(/e\.g\., myapp-/)).toBeDisabled();

    const input = domainInput();
    expect(input).not.toBeDisabled();
    fireEvent.change(input, { target: { value: "new.example.com" } });
    expect(input).toHaveValue("new.example.com");
  });

  it("surfaces a validation error against the field", () => {
    render(
      <ToastProvider>
        <BasicConfigStep
          newEnv={{ ...awsEnv, domain: "localhost" }}
          setNewEnv={() => {}}
          validationErrors={[
            { field: "domain", message: "Domain must be a hostname" },
          ]}
        />
      </ToastProvider>,
    );
    expect(screen.getByText("Domain must be a hostname")).toBeInTheDocument();
  });
});
