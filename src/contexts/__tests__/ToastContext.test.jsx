import { act, fireEvent, render, screen } from "@testing-library/react";

import { ToastProvider, useToast } from "../ToastContext";

function Notify({ message }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.success(message)}>
      {`Notify ${message}`}
    </button>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows an identical message once and restarts its timer", () => {
    render(
      <ToastProvider>
        <Notify message="Changes saved" />
      </ToastProvider>,
    );
    const notify = screen.getByRole("button", { name: "Notify Changes saved" });

    fireEvent.click(notify);
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.click(notify);

    expect(screen.getAllByText("Changes saved")).toHaveLength(1);
    // Gone 5 s after the second toast, not after the first.
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText("Changes saved")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText("Changes saved")).not.toBeInTheDocument();
  });

  it("stacks different messages", () => {
    render(
      <ToastProvider>
        <Notify message="Added aws-sandbox." />
        <Notify message="Deleted aws-sandbox." />
      </ToastProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Notify Added aws-sandbox." }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Notify Deleted aws-sandbox." }),
    );

    expect(screen.getByText("Added aws-sandbox.")).toBeInTheDocument();
    expect(screen.getByText("Deleted aws-sandbox.")).toBeInTheDocument();
  });
});
