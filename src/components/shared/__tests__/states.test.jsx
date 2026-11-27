import { render, screen } from "@testing-library/react";
import { FullScreenState } from "../states";

describe("FullScreenState", () => {
  it("reads a loading screen out as a status", () => {
    render(<FullScreenState logo loading title="Signing you in..." />);
    expect(screen.getByRole("status")).toHaveTextContent("Signing you in...");
  });
});
