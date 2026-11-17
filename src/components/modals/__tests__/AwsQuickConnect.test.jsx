import { render, screen, fireEvent } from "@testing-library/react";
import AwsQuickConnect from "../AwsQuickConnect";

const PRINTED =
  "openprime:123456789012:AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

const pasteLine = (text) =>
  fireEvent.change(screen.getByLabelText(/Paste the line it prints/), {
    target: { value: text },
  });

describe("AwsQuickConnect", () => {
  it("keeps Connect disabled until the printed line is pasted", () => {
    render(<AwsQuickConnect onSave={vi.fn()} onUseKeys={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();

    pasteLine("AKIAIOSFODNN7EXAMPLE");
    expect(
      screen.getByText(/That is not the line the command prints/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("saves the account and key from the pasted line", () => {
    const onSave = vi.fn();
    render(<AwsQuickConnect onSave={onSave} onUseKeys={vi.fn()} />);

    pasteLine(PRINTED);
    expect(
      screen.getByText("AWS account 123456789012 recognized"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(onSave).toHaveBeenCalledWith({
      provider: "aws",
      name: "AWS 123456789012",
      identifier: "123456789012",
      isDefault: true,
      credentials: {
        accessKey: "AKIAIOSFODNN7EXAMPLE",
        secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      },
    });
  });

  it("offers the key form for people who already have a key", () => {
    const onUseKeys = vi.fn();
    render(<AwsQuickConnect onSave={vi.fn()} onUseKeys={onUseKeys} />);
    fireEvent.click(
      screen.getByRole("button", { name: "I already have an access key" }),
    );
    expect(onUseKeys).toHaveBeenCalled();
  });

  it("opens CloudShell in a new tab", () => {
    render(<AwsQuickConnect onSave={vi.fn()} onUseKeys={vi.fn()} />);
    const link = screen.getByRole("link", { name: /Open AWS CloudShell/ });
    expect(link).toHaveAttribute(
      "href",
      "https://console.aws.amazon.com/cloudshell/home",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
