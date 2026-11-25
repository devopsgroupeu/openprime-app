import { render, screen } from "@testing-library/react";

import { Callout } from "@/components/shared/callout";

describe("Callout", () => {
  // An inline error (e.g. a failed job, now without a toast) must be
  // announced when it appears; the other tones are not urgent.
  it("announces the error variant as an alert", () => {
    render(
      <Callout variant="error">{"Couldn't generate the repository."}</Callout>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't generate the repository.",
    );
  });

  it.each(["info", "warning", "neutral"])(
    "leaves the %s variant unannounced",
    (variant) => {
      render(<Callout variant={variant}>Heads up.</Callout>);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );
});
