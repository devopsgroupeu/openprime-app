import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, Layers, Plus, Search } from "lucide-react";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { version } from "../../../package.json";
import logoInverse from "../../assets/openprime-logo-color-inverse.svg";
import symbol from "../../assets/openprime-symbol-color.svg";
import { SETTINGS_TABS } from "../SettingsPage";
import { MOD_KEY } from "./CommandPalette";
import UserMenu from "./UserMenu";

function NavItem({ to, icon: Icon, label, active }) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label} isActive={active} asChild>
        <Link
          to={to}
          aria-current={active ? "page" : undefined}
          // Also covers tapping the current page, where the route (and the
          // effect in AppSidebar) does not change.
          onClick={() => setOpenMobile(false)}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function MainNav({ pathname, onSearch }) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <NavItem
              to="/environments/create"
              icon={Plus}
              label="New environment"
            />
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={`Search (${MOD_KEY} K)`}
                onClick={onSearch}
              >
                <Search />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <NavItem
              to="/environments"
              icon={Layers}
              label="Environments"
              active={pathname.startsWith("/environments")}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

function SettingsNav({ pathname }) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <NavItem
              to="/environments"
              icon={ChevronLeft}
              label="Back to app"
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {SETTINGS_TABS.map((tab) => (
              <NavItem
                key={tab.id}
                to={`/settings/${tab.id}`}
                icon={tab.icon}
                label={tab.label}
                active={pathname === `/settings/${tab.id}`}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

/**
 * Deep-green app sidebar (port of openprime-ai AppSidebar / SettingsSidebar):
 * main nav everywhere, swapped for the settings nav on /settings/*.
 */
export default function AppSidebar({ onSearch }) {
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
    <Sidebar variant="inset" collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3">
        <Link
          to="/environments"
          aria-label="OpenPrime home"
          className="flex h-8 items-center rounded-md px-2 outline-hidden ring-sidebar-ring focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <img
            src={logoInverse}
            alt=""
            className="h-5 w-auto group-data-[collapsible=icon]:hidden"
          />
          <img
            src={symbol}
            alt=""
            className="hidden h-auto w-6 group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {inSettings ? (
          <SettingsNav pathname={pathname} />
        ) : (
          <MainNav pathname={pathname} onSearch={openSearch} />
        )}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {inSettings && (
          <span className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            v{version}
          </span>
        )}
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
