import { render, screen } from "@testing-library/react";
import GitFlow from "../basic-config/GitFlow";

const flow = () => screen.getByRole("img");

describe("GitFlow", () => {
  it("shows OpenPrime -> GitHub -> Argo CD when EKS is on", () => {
    render(<GitFlow url="git@github.com:acme/infra.git" argoCd />);
    expect(flow()).toHaveAccessibleName(
      "OpenPrime pushes the generated code to GitHub, and Argo CD on EKS pulls it from there.",
    );
    const names = [...flow().querySelectorAll("[data-node]")].map(
      (el) => el.textContent,
    );
    expect(names).toEqual(["OpenPrime", "GitHub", "Argo CD"]);
  });

  it("names GitLab, or a plain repository for another host", () => {
    const { rerender } = render(
      <GitFlow url="git@gitlab.com:acme/infra.git" argoCd />,
    );
    expect(flow()).toHaveAccessibleName(/to GitLab,/);
    rerender(<GitFlow url="git@git.example.com:acme/infra.git" argoCd />);
    expect(flow()).toHaveAccessibleName(/to your repository,/);
  });

  it("leaves Argo CD out without EKS, which is where it runs", () => {
    render(<GitFlow url="git@github.com:acme/infra.git" argoCd={false} />);
    expect(flow()).toHaveAccessibleName(
      "OpenPrime pushes the generated code to GitHub.",
    );
    expect(flow().querySelectorAll("[data-node]")).toHaveLength(2);
  });
});
