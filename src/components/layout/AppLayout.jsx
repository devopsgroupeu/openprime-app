import { useEffect, useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { matches, shortcut } from "@/lib/shortcuts";
import AppSidebar from "./AppSidebar";
import AppTopBar from "./AppTopBar";
import CommandPalette from "./CommandPalette";
import KeyboardShortcutsDialog from "./KeyboardShortcutsDialog";

/** Crumbs only from depth 2 (openprime-ai): the last one is the resource. */
export function breadcrumbsFor(pathname, environments) {
  const env = matchPath("/environments/:id", pathname);
  if (!env) return [];
  const name = environments.find((e) => e.id === env.params.id)?.name;
  return [
    { label: "Environments", to: "/environments" },
    { label: name || "Environment" },
  ];
}

/**
 * The app shell (port of openprime-ai AppShell): deep-green sidebar, top bar
 * with a hairline once the content scrolls, the Cmd+K palette and the
 * shortcuts dialog. The viewport never scrolls; the area under the top bar
 * does.
 */
const AppLayout = ({ environments }) => {
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Cmd/Ctrl+B is handled by the shadcn sidebar.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (matches(shortcut("commandPalette"), e)) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (matches(shortcut("shortcutsDialog"), e)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SidebarProvider className="h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AppSidebar
        onSearch={() => setPaletteOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
      />
      {/* SidebarInset is the <main> landmark. */}
      <SidebarInset id="main" tabIndex={-1} className="min-w-0 outline-none">
        <AppTopBar
          breadcrumbs={breadcrumbsFor(pathname, environments)}
          scrolled={scrolled}
        />
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          <Outlet />
        </div>
      </SidebarInset>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onShortcuts={() => setShortcutsOpen(true)}
        environments={environments}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </SidebarProvider>
  );
};

export default AppLayout;
