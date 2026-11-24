import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, Layers, PanelLeft, Plus, Search, X } from "lucide-react";
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
import { version } from "../../../package.json";
import logoInverse from "../../assets/openprime-logo-color-inverse.svg";
import { SETTINGS_TABS } from "../SettingsPage";
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
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex items-center gap-0.5">
      <Link
        to="/environments"
        aria-label="OpenPrime home"
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

/** App mode of the sidebar. */
function AppNav({ pathname }) {
  return (
    <>
      <SidebarGroup className={GROUP}>
        <SidebarMenu className="gap-px">
          <NavRow to="/environments/create" icon={Plus}>
            New environment
          </NavRow>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup className={GROUP}>
        <SidebarMenu className="gap-px">
          <NavRow
            to="/environments"
            icon={Layers}
            active={isActive(pathname, "/environments")}
          >
            Environments
          </NavRow>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function SettingsSearch({ query, onChange }) {
  return (
    <div className="relative flex h-7 items-center gap-1.5 px-1.5 text-sidebar-foreground/70 max-md:min-h-11">
      <Search className="size-4 shrink-0" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search settings"
        aria-label="Search settings"
        // `!` beats legacy.css's input[type=search] box (gone in Task 11).
        className="h-full! min-w-0 flex-1 rounded-none! border-0! bg-transparent! p-0! text-sm! text-sidebar-foreground! shadow-none! outline-none placeholder:text-sidebar-foreground/70 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="flex size-5 items-center justify-center rounded-md outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** Settings mode of the sidebar: Back to app, settings search, the tabs. */
function SettingsNav({ pathname }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const tabs = SETTINGS_TABS.filter((tab) =>
    tab.label.toLowerCase().includes(q),
  );

  return (
    // Back to app and the search stay put; the group scrolls.
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
        <SettingsSearch query={query} onChange={setQuery} />
      </SidebarHeader>
      <SidebarContent className="gap-0 px-2 pb-2">
        {tabs.length === 0 ? (
          <p
            role="status"
            className="px-1.5 py-2 text-xs text-sidebar-foreground/70"
          >
            No settings found.
          </p>
        ) : (
          <SidebarGroup className={GROUP}>
            <SidebarGroupLabel className={LABEL}>Personal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-px">
                {tabs.map((tab) => (
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
        )}
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
        {inSettings ? (
          <span className="px-1.5 text-xs text-sidebar-foreground/70">
            v{version}
          </span>
        ) : null}
        <UserMenu onShortcuts={onShortcuts} />
      </SidebarFooter>
    </Sidebar>
  );
}
