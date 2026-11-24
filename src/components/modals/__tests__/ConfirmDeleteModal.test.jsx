import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConfirmDeleteModal from "../ConfirmDeleteModal";

const baseProps = {
  isOpen: true,
  onClose: () => {},
  onConfirm: () => {},
};

describe("ConfirmDeleteModal", () => {
  it("renders the generic delete confirmation when no warningData is provided", () => {
    render(<ConfirmDeleteModal {...baseProps} title="Delete Credential" />);

    expect(screen.getByText("Delete Credential")).toBeInTheDocument();
    expect(
      screen.queryByText(/credential is used by/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't check/i)).not.toBeInTheDocument();
  });

  it("shows a usage warning with environment names when count > 0", () => {
    const warningData = {
      count: 3,
      environments: [
        { id: "env-1", name: "production" },
        { id: "env-2", name: "staging" },
        { id: "env-3", name: "development" },
      ],
    };

    render(
      <ConfirmDeleteModal
        {...baseProps}
        title="Delete Credential"
        warningData={warningData}
      />,
    );

    expect(
      screen.getByText(/This credential is used by 3 environments/i),
    ).toBeInTheDocument();
    expect(screen.getByText("production")).toBeInTheDocument();
    expect(screen.getByText("staging")).toBeInTheDocument();
    expect(screen.getByText("development")).toBeInTheDocument();
  });

  it("lists up to 5 environments and shows a remainder count", () => {
    const warningData = {
      count: 7,
      environments: [
        { id: "env-1", name: "one" },
        { id: "env-2", name: "two" },
        { id: "env-3", name: "three" },
        { id: "env-4", name: "four" },
        { id: "env-5", name: "five" },
      ],
    };

    render(
      <ConfirmDeleteModal
        {...baseProps}
        title="Delete Credential"
        warningData={warningData}
      />,
    );

    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByText("three")).toBeInTheDocument();
    expect(screen.getByText("four")).toBeInTheDocument();
    expect(screen.getByText("five")).toBeInTheDocument();
    expect(screen.getByText(/and 2 more/i)).toBeInTheDocument();
  });

  it("shows a check-failed warning when the usage check failed", () => {
    render(
      <ConfirmDeleteModal
        {...baseProps}
        title="Delete Credential"
        warningData={{ checkFailed: true }}
      />,
    );

    expect(
      screen.getByText(
        /Couldn't check which environments use this credential/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/credential is used by/i),
    ).not.toBeInTheDocument();
  });

  it("shows no warning when count is 0", () => {
    render(
      <ConfirmDeleteModal
        {...baseProps}
        title="Delete Credential"
        warningData={{ count: 0, environments: [] }}
      />,
    );

    expect(
      screen.queryByText(/credential is used by/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't check/i)).not.toBeInTheDocument();
  });

  it("calls onClose once on Escape", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDeleteModal
        {...baseProps}
        onClose={onClose}
        title="Delete Credential"
      />,
    );

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm from the Delete button, then closes", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDeleteModal
        {...baseProps}
        onConfirm={onConfirm}
        onClose={onClose}
        title="Delete Credential"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("names the environment when deleting one (EnvironmentDetailPage)", () => {
    render(
      <ConfirmDeleteModal
        environment={{ id: "env-001", name: "demo-prod" }}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText('Delete "demo-prod"?')).toBeInTheDocument();
  });
});
