import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import DeployGuideDialog from "../DeployGuideDialog";
import { generateSshKeyPair } from "../../../utils/sshKeyPair";

vi.mock("../../../utils/sshKeyPair", () => ({ generateSshKeyPair: vi.fn() }));

const REPO = "git@github.com:acme/infra.git";
const LINE =
  "openprime:123456789012:AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

let clipboard;
beforeEach(() => {
  clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: clipboard },
    configurable: true,
  });
});

const renderDialog = (props = {}) =>
  render(
    <DeployGuideDialog
      isOpen
      repoUrl={REPO}
      onClose={vi.fn()}
      onDone={vi.fn()}
      {...props}
    />,
  );

const link = (name) => screen.getByRole("link", { name });

describe("DeployGuideDialog", () => {
  it("links every GitHub page the deployment needs, for this repository", () => {
    renderDialog();

    expect(link(/Open New secret/)).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/settings/secrets/actions/new",
    );
    expect(link(/Open Terraform Deployment/)).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/actions/workflows/terraform-deploy.yml",
    );
    expect(link(/Open issues/)).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/issues",
    );
  });

  it("splits the line from step 1 into the two AWS secrets", async () => {
    renderDialog();
    const copySecret = screen.getByRole("button", {
      name: "Copy the secret for AWS_SECRET_ACCESS_KEY",
    });
    expect(copySecret).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Paste the line the AWS command/), {
      target: { value: LINE },
    });

    expect(screen.getByText("AKIAIOSFODNN7EXAMPLE")).toBeInTheDocument();
    // The secret itself is never shown, only copied.
    expect(
      screen.queryByText("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
    ).not.toBeInTheDocument();
    fireEvent.click(copySecret);
    await waitFor(() =>
      expect(clipboard).toHaveBeenCalledWith(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copy the name AWS_ACCESS_KEY_ID" }),
    );
    await waitFor(() =>
      expect(clipboard).toHaveBeenCalledWith("AWS_ACCESS_KEY_ID"),
    );
  });

  it("fills in the AWS key remembered from step 1, and takes another line instead", async () => {
    renderDialog({
      rememberedAwsKey: {
        accessKey: "AKIAREMEMBERED00001",
        secretKey: "remembered-secret",
      },
    });

    expect(
      screen.queryByLabelText(/Paste the line the AWS command/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/The AWS key from step 1 is filled in below/),
    ).toBeInTheDocument();
    expect(screen.getByText("AKIAREMEMBERED00001")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy the secret for AWS_SECRET_ACCESS_KEY",
      }),
    );
    await waitFor(() =>
      expect(clipboard).toHaveBeenCalledWith("remembered-secret"),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Paste a different line" }),
    );
    fireEvent.change(screen.getByLabelText(/Paste the line the AWS command/), {
      target: { value: LINE },
    });
    expect(screen.getByText("AKIAIOSFODNN7EXAMPLE")).toBeInTheDocument();
  });

  it("says when the pasted text is not the line", () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/Paste the line the AWS command/), {
      target: { value: "AKIAIOSFODNN7EXAMPLE" },
    });

    expect(
      screen.getByText(/That is not the line the command prints/),
    ).toBeInTheDocument();
  });

  it("creates the read-only Argo CD key and fills its secret", async () => {
    generateSshKeyPair.mockResolvedValue({
      privateKey: "argocd-private-key",
      publicKey: "ssh-rsa argocd-public-key openprime-deploy",
    });
    renderDialog();

    fireEvent.click(
      screen.getByRole("button", { name: "Create the Argo CD key" }),
    );

    expect(
      await screen.findByText("ssh-rsa argocd-public-key openprime-deploy"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Leave Allow write access unticked."),
    ).toBeVisible();
    expect(link(/Open deploy keys/)).toHaveAttribute(
      "href",
      "https://github.com/acme/infra/settings/keys/new",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy the secret for TF_VAR_GIT_REPO_SSH_KEY",
      }),
    );
    await waitFor(() =>
      expect(clipboard).toHaveBeenCalledWith("argocd-private-key"),
    );
  });

  it("asks for two approvals and copies the word", async () => {
    renderDialog();

    expect(
      screen.getByText("Approve Terraform apply (AWS)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Approve Terraform apply (Kubernetes)"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy approve" }));
    await waitFor(() => expect(clipboard).toHaveBeenCalledWith("approve"));
  });

  it("has no links for a repository outside github.com", () => {
    renderDialog({ repoUrl: "git@gitlab.com:acme/infra.git" });

    expect(screen.getByText(/not on github.com/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open New secret/ })).toBeNull();
  });

  it("forgets the pasted line once closed", () => {
    const { rerender } = renderDialog();
    fireEvent.change(screen.getByLabelText(/Paste the line the AWS command/), {
      target: { value: LINE },
    });

    const props = { repoUrl: REPO, onClose: vi.fn(), onDone: vi.fn() };
    rerender(<DeployGuideDialog isOpen={false} {...props} />);
    rerender(<DeployGuideDialog isOpen {...props} />);

    expect(screen.getByLabelText(/Paste the line the AWS command/)).toHaveValue(
      "",
    );
  });
});
