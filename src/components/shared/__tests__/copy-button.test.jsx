import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import { CopyButton } from "../copy-button";

const renderButton = () =>
  render(
    <ThemeProvider>
      <ToastProvider>
        <CopyButton text="env-001" label="Copy ID" visibleLabel="Copy" />
      </ToastProvider>
    </ThemeProvider>,
  );

const stubClipboard = (writeText) =>
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });

describe("CopyButton", () => {
  afterEach(() => vi.useRealTimers());

  it("copies the text and confirms for 1.5 s", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderButton();

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Copy ID" })),
    );

    expect(writeText).toHaveBeenCalledWith("env-001");
    expect(screen.getByRole("button", { name: "Copied" })).toHaveTextContent(
      "Copied",
    );
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("button", { name: "Copy ID" })).toHaveTextContent(
      "Copy",
    );
  });

  it("says so when the clipboard refuses, without confirming", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    renderButton();

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Copy ID" })),
    );

    expect(
      await screen.findByText("Couldn't copy to the clipboard."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copied" }),
    ).not.toBeInTheDocument();
  });

  it("leaves no timer behind when it unmounts while confirming", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { unmount } = renderButton();

    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Copy ID" })),
    );
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
