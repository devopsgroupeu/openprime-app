import { fireEvent, render } from "@testing-library/react";
import { Package } from "lucide-react";

import { LogoTile } from "@/components/shared/logo-tile";

const tile = (container) => container.querySelector('[data-slot="logo-tile"]');

describe("LogoTile", () => {
  it("shows the logo on the white logo tile, never recoloured", () => {
    const { container } = render(
      <LogoTile logo="/assets/chart-logos/loki.svg" icon={Package} />,
    );
    const el = tile(container);
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("bg-(--logo-tile)");
    const img = el.querySelector("img");
    expect(img).toHaveAttribute("src", "/assets/chart-logos/loki.svg");
    expect(img).toHaveAttribute("alt", "");
    expect(el.querySelector("svg")).toBeNull();
  });

  it("shows the lucide stand-in on the muted tile when there is no file", () => {
    const { container } = render(<LogoTile logo={null} icon={Package} />);
    const el = tile(container);
    expect(el).toHaveClass("bg-muted");
    expect(el).not.toHaveClass("bg-(--logo-tile)");
    expect(el.querySelector("img")).toBeNull();
    expect(el.querySelector("svg")).toHaveClass("lucide-package");
  });

  it("falls back to the stand-in when the logo fails to load", () => {
    const { container } = render(
      <LogoTile logo="/assets/chart-logos/missing.svg" icon={Package} />,
    );
    fireEvent.error(tile(container).querySelector("img"));
    const el = tile(container);
    expect(el.querySelector("img")).toBeNull();
    expect(el.querySelector("svg")).toHaveClass("lucide-package");
    expect(el).toHaveClass("bg-muted");
  });

  // A tile reused for another logo (a URL typed into the git field) tries
  // the new file instead of staying on the stand-in.
  it("tries a new logo after an earlier one failed", () => {
    const { container, rerender } = render(
      <LogoTile logo="/assets/chart-logos/missing.svg" icon={Package} />,
    );
    fireEvent.error(tile(container).querySelector("img"));
    rerender(<LogoTile logo="/assets/chart-logos/gitlab.svg" icon={Package} />);
    expect(tile(container).querySelector("img")).toHaveAttribute(
      "src",
      "/assets/chart-logos/gitlab.svg",
    );
  });
});
