import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router";
import { SkipLink } from "@/components/shared/skip-link";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { matches, shortcut } from "@/lib/shortcuts";
import AuraChatButton from "../AuraChatButton";
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
 * with a hairline once the content scrolls, the Cmd+K palette, the
 * shortcuts dialog and the floating Aura. The viewport never scrolls; the area
 * under the top bar does.
 */
const AppLayout = ({ environments }) => {
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollerRef = useRef(null);

  // A new page starts at the top; the scroller outlives the route.
  useLayoutEffect(() => {
    scrollerRef.current.scrollTop = 0;
  }, [pathname]);

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
      <SkipLink />
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
          ref={scrollerRef}
          data-slot="page-scroller"
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          {/* pb-16: the last card scrolls clear of the Aura launcher. */}
          <div className="pb-16">
            <Outlet />
          </div>
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
      <AuraChatButton />
    </SidebarProvider>
  );
};

export default AppLayout;
