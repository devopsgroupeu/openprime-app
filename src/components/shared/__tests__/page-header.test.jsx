import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { PageHeader } from "../page-header";

describe("PageHeader", () => {
  // outline-none only drops the ring of an h1 that script focuses.
  it("hides the outline only of a focusable heading", () => {
    const { unmount } = render(<PageHeader title="Environments" />);
    const plain = screen.getByRole("heading", { level: 1 });
    expect(plain).not.toHaveAttribute("tabindex");
    expect(plain).not.toHaveClass("outline-none");
    unmount();

    render(<PageHeader title="Services" headingRef={createRef()} />);
    const focusable = screen.getByRole("heading", { level: 1 });
    expect(focusable).toHaveAttribute("tabindex", "-1");
    expect(focusable).toHaveClass("outline-none");
  });
});
