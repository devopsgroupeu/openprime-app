import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router";
import { SkipLink } from "@/components/shared/skip-link";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { matches, shortcut } from "@/lib/shortcuts";
import { wizardRoute } from "../../config/nav";
import { CatalogProvider } from "../../contexts/CatalogContext";
import AuraChatButton from "../AuraChatButton";
import ErrorBoundary, { PageCrash } from "../ErrorBoundary";
import AppSidebar from "./AppSidebar";
import AppTopBar, { TopBarSlot } from "./AppTopBar";
import CommandPalette from "./CommandPalette";
import KeyboardShortcutsDialog from "./KeyboardShortcutsDialog";

/**
 * Crumbs only from depth 2 (openprime-ai): the last one is the page. The
 * environment is named as saved (the list's copy).
 */
export function breadcrumbsFor(pathname, environments) {
  const root = { label: "Environments", to: "/environments" };
  const nameOf = (id) =>
    environments.find((e) => e.id === id)?.name || "Environment";
  const wizard = wizardRoute(pathname);
  if (wizard?.mode === "create") return [root, { label: "New environment" }];
  if (wizard)
    return [
      root,
      { label: nameOf(wizard.id), to: `/environments/${wizard.id}` },
      { label: "Edit" },
    ];
  const env = matchPath("/environments/:id", pathname);
  return env ? [root, { label: nameOf(env.params.id) }] : [];
}

/**
 * The app shell (port of openprime-ai AppShell): deep-green sidebar, top bar
 * with a hairline once the content scrolls, the Cmd+K palette, the
 * shortcuts dialog and the floating Aura. The viewport never scrolls; the area
 * under the top bar does. Every signed-in page renders here, the wizard too
 * (it fills the area and scrolls its own columns). The pages that read the
 * service catalog wait for it in their own loading state; when a page
 * crashes, the content area says so. The shell stays.
 */
const AppLayout = ({ environments }) => {
  const { pathname } = useLocation();
  const wizard = Boolean(wizardRoute(pathname));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // The open page's own palette group (usePaletteActions).
  const [pageActions, setPageActions] = useState(null);
  // The top bar's slot for the page's own controls (TopBarActions).
  const [actionsSlot, setActionsSlot] = useState(null);
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
          actionsRef={setActionsSlot}
        />
        <div
          ref={scrollerRef}
          data-slot="page-scroller"
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
        >
          {/* pb-16: the last card scrolls clear of the Aura launcher. Not
              under a SaveBar: it would lift the bar off its sticky place at
              the end of the page, under the launcher. A page with a SaveBar
              fills the screen, so a short one has its bar at the bottom too,
              under the Aura launcher and window, never behind them. The
              wizard has no launcher and fills the area. */}
          <div
            className={
              wizard
                ? "h-full"
                : "pb-16 has-[[data-slot=save-bar]]:flex has-[[data-slot=save-bar]]:min-h-full has-[[data-slot=save-bar]]:flex-col has-[[data-slot=save-bar]]:pb-0"
            }
          >
            <CatalogProvider>
              {/* Reset by a route change, never remounted by one: a settings
                  tab switch keeps the form's edits. */}
              <ErrorBoundary resetKey={pathname} fallback={PageCrash}>
                <TopBarSlot.Provider value={actionsSlot}>
                  <Outlet context={setPageActions} />
                </TopBarSlot.Provider>
              </ErrorBoundary>
            </CatalogProvider>
          </div>
        </div>
      </SidebarInset>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onShortcuts={() => setShortcutsOpen(true)}
        environments={environments}
        pageActions={pageActions}
      />
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      {/* One Aura per screen: the wizard has its own panel. Kept mounted
          there, so its conversation survives a wizard visit. */}
      <AuraChatButton
        hidden={wizard}
        greet={Boolean(matchPath("/environments", pathname))}
      />
    </SidebarProvider>
  );
};

export default AppLayout;
