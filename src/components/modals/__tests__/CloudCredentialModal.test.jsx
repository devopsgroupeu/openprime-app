import { render, screen, fireEvent } from "@testing-library/react";
import CloudCredentialModal from "../CloudCredentialModal";

const baseProps = {
  isOpen: true,
  provider: "aws",
  onClose: () => {},
  onSave: () => {},
};

describe("CloudCredentialModal", () => {
  it("rejects a non-12-digit account ID when creating a new credential", () => {
    render(<CloudCredentialModal {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Production account"), {
      target: { value: "New Credential" },
    });
    fireEvent.change(screen.getByPlaceholderText("123456789012"), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("AKIAIOSFODNN7EXAMPLE"), {
      target: { value: "AKIAIOSFODNN7EXAMPLE" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
      {
        target: { value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Add credentials/i }));

    expect(
      screen.getByText("Account ID must be exactly 12 digits"),
    ).toBeInTheDocument();
  });

  it("accepts a 12-digit account ID when creating a new credential", () => {
    const onSave = vi.fn();
    render(<CloudCredentialModal {...baseProps} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Production account"), {
      target: { value: "New Credential" },
    });
    fireEvent.change(screen.getByPlaceholderText("123456789012"), {
      target: { value: "123456789012" },
    });
    fireEvent.change(screen.getByPlaceholderText("AKIAIOSFODNN7EXAMPLE"), {
      target: { value: "AKIAIOSFODNN7EXAMPLE" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
      {
        target: { value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Add credentials/i }));

    expect(
      screen.queryByText("Account ID must be exactly 12 digits"),
    ).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalled();
  });

  it("allows editing an existing credential with an unchanged legacy non-12-digit identifier", () => {
    const onSave = vi.fn();
    const credential = {
      id: "cred-legacy",
      name: "Legacy Credential",
      provider: "aws",
      identifier: "AKIA****MOCK",
      isDefault: false,
    };

    render(
      <CloudCredentialModal
        {...baseProps}
        credential={credential}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("e.g. Production account"), {
      target: { value: "Updated Legacy Credential" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    expect(
      screen.queryByText("Account ID must be exactly 12 digits"),
    ).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalled();
  });

  it("rejects a changed invalid account ID when editing an existing credential", () => {
    const credential = {
      id: "cred-001",
      name: "aws-sandbox",
      provider: "aws",
      identifier: "123456789012",
      isDefault: false,
    };

    render(<CloudCredentialModal {...baseProps} credential={credential} />);

    fireEvent.change(screen.getByPlaceholderText("123456789012"), {
      target: { value: "12345" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    expect(
      screen.getByText("Account ID must be exactly 12 digits"),
    ).toBeInTheDocument();
  });

  it("closes on Escape through onClose", () => {
    const onClose = vi.fn();
    render(<CloudCredentialModal {...baseProps} onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
