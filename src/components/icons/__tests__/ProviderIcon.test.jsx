import { render } from "@testing-library/react";
import ProviderIcon from "../ProviderIcon";

const fills = (container) =>
  [...container.querySelectorAll("path, stop")].map((el) =>
    (
      el.getAttribute("fill") ||
      el.getAttribute("stop-color") ||
      ""
    ).toLowerCase(),
  );

describe("ProviderIcon", () => {
  it("draws the AWS logo with its orange smile and a theme-aware wordmark", () => {
    const { container } = render(<ProviderIcon provider="aws" />);
    expect(fills(container)).toContain("#ff9900");
    // Squid ink on light surfaces, white (AWS's reverse logo) on dark ones.
    const wordmark = container.querySelector("path[class]");
    expect(wordmark).toHaveClass("fill-[#252f3e]", "dark:fill-white");
  });

  it("draws the Azure logo in its official blues", () => {
    const { container } = render(<ProviderIcon provider="azure" />);
    expect(fills(container)).toEqual(
      expect.arrayContaining(["#0078d4", "#114a8b", "#3ccbf4"]),
    );
  });

  it("gives every Azure logo its own gradient ids", () => {
    const { container } = render(
      <>
        <ProviderIcon provider="azure" />
        <ProviderIcon provider="azure" />
      </>,
    );
    const [first, second] = container.querySelectorAll("svg");
    const ids = (svg) =>
      [...svg.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(ids(first)).toHaveLength(3);
    expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    for (const svg of [first, second]) {
      for (const path of svg.querySelectorAll('path[fill^="url("]')) {
        const ref = path.getAttribute("fill").slice(5, -1);
        expect(ids(svg)).toContain(ref);
      }
    }
  });

  it("draws the Google Cloud mark in the four Google colors", () => {
    const { container } = render(<ProviderIcon provider="gcp" />);
    expect(fills(container)).toEqual([
      "#ea4335",
      "#4285f4",
      "#34a853",
      "#fbbc05",
    ]);
  });

  it("keeps the neutral server icon for on-premises", () => {
    const { container } = render(<ProviderIcon provider="onpremise" />);
    expect(container.querySelector("svg")).toHaveClass("lucide-server");
  });
});
