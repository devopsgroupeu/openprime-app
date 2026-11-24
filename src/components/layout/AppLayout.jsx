import { useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SETTINGS_TABS } from "../SettingsPage";
import AppSidebar from "./AppSidebar";
import AppTopBar from "./AppTopBar";
import CommandPalette from "./CommandPalette";

function breadcrumbsFor(pathname, environments) {
  const env = matchPath("/environments/:id", pathname);
  if (env) {
    const name = environments.find((e) => e.id === env.params.id)?.name;
    return [
      { label: "Environments", to: "/environments" },
      { label: name || "Environment" },
    ];
  }
  const settings = matchPath("/settings/:tab", pathname);
  if (settings) {
    const tab = SETTINGS_TABS.find((t) => t.id === settings.params.tab);
    return [
      { label: "Settings", to: "/settings/account" },
      { label: tab?.label ?? "Account" },
    ];
  }
  return [{ label: "Environments" }];
}

/**
 * The app shell: deep-green inset sidebar, slim top bar and the Cmd+K
 * palette. The viewport never scrolls; the area under the top bar does (and
 * PageShell, once a page uses it, takes that over with its own scroller).
 */
const AppLayout = ({ environments }) => {
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar onSearch={() => setPaletteOpen(true)} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppTopBar breadcrumbs={breadcrumbsFor(pathname, environments)} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        environments={environments}
      />
    </SidebarProvider>
  );
};

export default AppLayout;
