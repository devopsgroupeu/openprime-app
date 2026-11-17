import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import OnboardingGuide from "../OnboardingGuide";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderGuide(props) {
  return render(
    <MemoryRouter initialEntries={["/environments"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <OnboardingGuide {...props} />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

const stepNamed = (name) =>
  screen.getByRole("heading", { name: new RegExp(name) }).closest("li");

const envWithRepo = {
  id: "env-001",
  git_repository: { url: "git@github.com:acme/infra.git" },
  last_push_status: null,
};

describe("OnboardingGuide", () => {
  beforeEach(() => localStorage.clear());

  it("starts a new user at connecting AWS, with nothing done", () => {
    const onConnectAws = vi.fn();
    renderGuide({ environments: [], hasCredentials: false, onConnectAws });

    expect(screen.getByText("0 of 5 done")).toBeInTheDocument();
    const aws = stepNamed("Connect your AWS account");
    expect(aws).toHaveAttribute("aria-current", "step");

    fireEvent.click(within(aws).getByRole("button", { name: "Connect AWS" }));
    expect(onConnectAws).toHaveBeenCalled();
    // No documentation to read on the way.
    expect(within(aws).queryByRole("link")).not.toBeInTheDocument();
  });

  it("ticks the steps the app can see and points at the next one", () => {
    renderGuide({ environments: [envWithRepo], hasCredentials: true });

    expect(screen.getByText("3 of 5 done")).toBeInTheDocument();
    const push = stepNamed("Send the code to your repository");
    expect(push).toHaveAttribute("aria-current", "step");

    fireEvent.click(
      within(push).getByRole("button", { name: "Open environment" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/environments/env-001",
    );
  });

  it("counts a push only when it succeeded", () => {
    renderGuide({
      environments: [{ ...envWithRepo, last_push_status: "failed" }],
      hasCredentials: true,
    });
    expect(screen.getByText("3 of 5 done")).toBeInTheDocument();
  });

  it("opens GitHub in a new tab for the repository step", () => {
    renderGuide({ environments: [], hasCredentials: true });
    const link = within(
      stepNamed("Create an empty repository on GitHub"),
    ).getByRole("link", { name: /Open GitHub/ });
    expect(link).toHaveAttribute("href", "https://github.com/new");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows how to deploy and lets the user tick the last step", () => {
    renderGuide({
      environments: [{ ...envWithRepo, last_push_status: "succeeded" }],
      hasCredentials: true,
    });
    const deploy = stepNamed("Start the deployment");

    fireEvent.click(
      within(deploy).getByRole("button", { name: "Show me how" }),
    );
    expect(within(deploy).getByText(/Run workflow/)).toBeInTheDocument();

    fireEvent.click(
      within(deploy).getByRole("button", { name: "Mark as done" }),
    );
    expect(screen.queryByText(/of 5 done/)).not.toBeInTheDocument();
    expect(localStorage.getItem("openprime-onboarding-deployed")).toBe("true");
  });

  it("collapses to one line when hidden and can be shown again", () => {
    const { unmount } = renderGuide({
      environments: [],
      hasCredentials: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByText("1 of 5 done")).not.toBeInTheDocument();
    expect(screen.getByText("Setup guide: 1 of 5 done")).toBeInTheDocument();

    // Hidden survives a reload...
    unmount();
    renderGuide({ environments: [], hasCredentials: true });
    expect(screen.getByText("Setup guide: 1 of 5 done")).toBeInTheDocument();

    // ...and "Show" brings the full guide back.
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("1 of 5 done")).toBeInTheDocument();
    expect(localStorage.getItem("openprime-onboarding-hidden")).toBeNull();
  });
});
