import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, Layers, PanelLeft, Plus, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoInverse from "../../assets/openprime-logo-color-inverse.svg";
import { SETTINGS_TABS, wizardRoute } from "../../config/nav";
import { IconAction } from "./IconAction";
import UserMenu from "./UserMenu";

// Row recipe (openprime-ai): 28 px, 6 px padding, 8 px radius, 13 px label at 80 %.
const ROW =
  "h-7 gap-1.5 rounded-lg px-1.5 text-sidebar-foreground/80 data-[active=true]:font-normal max-md:min-h-11";
const LABEL = "h-6 px-1.5 text-xs font-normal text-sidebar-foreground/70";
const GROUP = "p-0 pt-2.5 first:pt-0";
const ICON_BUTTON =
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

function isActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** One sidebar row: a link with an icon, active state and aria-current. */
function NavRow({ to, active = false, icon: Icon, children }) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} className={ROW}>
        <Link
          to={to}
          aria-current={active ? "page" : undefined}
          // Also covers tapping the current page, where the route (and the
          // effect in AppSidebar) does not change.
          onClick={() => setOpenMobile(false)}
        >
          <Icon aria-hidden />
          <span className="min-w-0 flex-1 truncate">{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Top row: home (the OpenPrime mark), Search (palette) and Hide sidebar. */
function TopRow({ onSearch }) {
  const { setOpenMobile, toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center gap-0.5">
      <Link
        to="/environments"
        aria-label="OpenPrime home"
        onClick={() => setOpenMobile(false)}
        className="mr-auto flex h-7 min-w-0 items-center rounded-lg px-1.5 outline-none transition-[background-color] duration-(--dur-fast) hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring max-md:min-h-11"
      >
        <img src={logoInverse} alt="" className="h-4 w-auto" />
      </Link>
      <IconAction
        label="Search"
        icon={Search}
        shortcutId="commandPalette"
        onClick={onSearch}
        className={ICON_BUTTON}
      />
      <IconAction
        label="Hide sidebar"
        icon={PanelLeft}
        shortcutId="toggleSidebar"
        onClick={toggleSidebar}
        className={ICON_BUTTON}
      />
    </div>
  );
}

/** App mode of the sidebar. The create wizard is New environment's page. */
function AppNav({ pathname }) {
  const creating = wizardRoute(pathname)?.mode === "create";
  return (
    <>
      <SidebarGroup className={GROUP}>
        <SidebarMenu className="gap-px">
          <NavRow to="/environments/create" icon={Plus} active={creating}>
            New environment
          </NavRow>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className={GROUP}>
        <SidebarMenu className="gap-px">
          <NavRow
            to="/environments"
            icon={Layers}
            active={!creating && isActive(pathname, "/environments")}
          >
            Environments
          </NavRow>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

/** Settings mode of the sidebar: Back to app and the tabs. */
function SettingsNav({ pathname }) {
  return (
    // Back to app stays put; the group scrolls.
    <nav
      aria-label="Settings sections"
      className="flex min-h-0 flex-1 flex-col"
    >
      <SidebarHeader className="gap-1 px-2 pt-2 pb-1">
        <SidebarMenu className="gap-px">
          <NavRow to="/environments" icon={ChevronLeft}>
            Back to app
          </NavRow>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2 pb-2">
        <SidebarGroup className={GROUP}>
          <SidebarGroupLabel className={LABEL}>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {SETTINGS_TABS.map((tab) => (
                <NavRow
                  key={tab.id}
                  to={`/settings/${tab.id}`}
                  icon={tab.icon}
                  active={pathname === `/settings/${tab.id}`}
                >
                  {tab.label}
                </NavRow>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </nav>
  );
}

/**
 * The one sidebar (port of openprime-ai AppSidebar): app navigation, or the
 * settings navigation on /settings/*.
 */
export default function AppSidebar({ onSearch, onShortcuts }) {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const inSettings = pathname.startsWith("/settings");

  // The mobile Sheet must not keep covering the page after any navigation,
  // including the ones started from the user menu.
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const openSearch = () => {
    setOpenMobile(false);
    onSearch();
  };

  return (
    <Sidebar collapsible="offcanvas">
      {inSettings ? (
        <SettingsNav pathname={pathname} />
      ) : (
        <>
          <SidebarHeader className="px-2 pt-2 pb-2.5">
            <TopRow onSearch={openSearch} />
          </SidebarHeader>
          <SidebarContent className="gap-0 px-2">
            <nav aria-label="Main navigation" className="flex flex-col pb-2">
              <AppNav pathname={pathname} />
            </nav>
          </SidebarContent>
        </>
      )}
      <SidebarFooter className="gap-2 px-2 pt-1 pb-2">
        <UserMenu onShortcuts={onShortcuts} />
      </SidebarFooter>
    </Sidebar>
  );
}
