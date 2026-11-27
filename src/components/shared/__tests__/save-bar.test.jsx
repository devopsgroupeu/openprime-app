import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useUnsavedGuard } from "../save-bar";

// A page with the guard on and its prompt as text.
function GuardedPage({ children }) {
  const guard = useUnsavedGuard(true);
  return (
    <>
      {guard.pending ? <p>Leave this page?</p> : null}
      {children}
    </>
  );
}

// Clicks that reach the end of their way, and whether the guard cancelled
// them; jsdom does not navigate, so the default action is cancelled here.
let reached;
const record = (e) => {
  reached.push(e.defaultPrevented);
  e.preventDefault();
};
beforeEach(() => {
  reached = [];
  window.addEventListener("click", record);
});
afterEach(() => window.removeEventListener("click", record));

const renderPage = (link) =>
  render(
    <MemoryRouter initialEntries={["/environments/env-001"]}>
      <GuardedPage>{link}</GuardedPage>
    </MemoryRouter>,
  );

describe("useUnsavedGuard", () => {
  it("asks before an in-app link leaves the page", () => {
    renderPage(<a href="/environments">Environments</a>);

    expect(fireEvent.click(screen.getByText("Environments"))).toBe(false);
    expect(screen.getByText("Leave this page?")).toBeInTheDocument();
  });

  // A ZIP download clicks a link to a blob: URL, which has the page's own
  // origin; it is not a navigation and must go through.
  it.each([
    ["a download link", { download: "env.zip", href: "/jobs/1/download" }],
    ["a blob: URL", { href: "blob:http://localhost:3000/4f1c-9e2a" }],
    ["a data: URL", { href: "data:application/zip;base64,UEsDBA==" }],
    ["a mailto: link", { href: "mailto:support@openprime.io" }],
  ])("lets %s through", (_, props) => {
    renderPage(<a {...props}>File</a>);

    fireEvent.click(screen.getByText("File"));
    expect(reached).toEqual([false]);
    expect(screen.queryByText("Leave this page?")).toBeNull();
  });
});
