import { useNavigate } from "react-router";
import {
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export const DOCS_URL = "https://docs.openprime.io";

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

/** Sidebar-footer user row and its menu (item list mirrors openprime-ai). */
export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const name = user?.fullName || user?.username || "Account";
  const email = user?.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              aria-label="Account menu"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-sidebar-primary/25 text-xs font-medium text-sidebar-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{name}</span>
                {email && (
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {email}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <div className="grid min-w-0 px-2 py-1.5 leading-tight">
              <span className="truncate text-sm font-medium">{name}</span>
              {email && (
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings/account")}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Documentation
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleTheme}>
              {isDark ? <Sun /> : <Moon />}
              {isDark ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
