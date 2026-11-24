import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { breadcrumbsFor } from "../AppLayout";
import AppTopBar from "../AppTopBar";

const environments = [{ id: "env-1", name: "demo-prod" }];

describe("breadcrumbsFor", () => {
  it("has no crumbs on depth-1 and settings pages", () => {
    expect(breadcrumbsFor("/environments", environments)).toEqual([]);
    expect(breadcrumbsFor("/settings/account", environments)).toEqual([]);
  });

  it("names the environment on its detail page", () => {
    expect(breadcrumbsFor("/environments/env-1", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "demo-prod" },
    ]);
    expect(breadcrumbsFor("/environments/unknown", environments)).toEqual([
      { label: "Environments", to: "/environments" },
      { label: "Environment" },
    ]);
  });
});

describe("AppTopBar", () => {
  it("links every crumb but the last, which is the current page", () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AppTopBar
            breadcrumbs={breadcrumbsFor("/environments/env-1", environments)}
          />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(crumbs).getByRole("link", { name: "Environments" }),
    ).toHaveAttribute("href", "/environments");
    expect(within(crumbs).getByText("demo-prod")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
