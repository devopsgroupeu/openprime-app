import { render } from "@testing-library/react";
import ServiceIcon from "../ServiceIcon";

describe("ServiceIcon", () => {
  it("renders the official AWS icon for a known service", () => {
    const { container } = render(<ServiceIcon service="rds" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src").toLowerCase()).toContain("rds");
    expect(img).toHaveAttribute("alt", "");
  });

  it("falls back to the lucide icon for an unknown service", () => {
    const { container } = render(<ServiceIcon service="unknown" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
