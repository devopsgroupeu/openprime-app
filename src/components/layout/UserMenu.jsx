import { Link } from "react-router";
import {
  BookOpen,
  ChevronsUpDown,
  CircleQuestionMark,
  Keyboard,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export const DOCS_URL = "https://docs.openprime.io";

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

/** User menu (port of openprime-ai UserMenu): the bottom row of the sidebar, opening upward. */
export default function UserMenu({ onShortcuts = () => {} }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  // On mobile the menu sits in the sidebar Sheet; its items close the Sheet,
  // also when Settings is the current page and the route does not change.
  const { setOpenMobile } = useSidebar();
  const name = user?.fullName || user?.username || "Account";
  const avatar = (size) => (
    <Avatar className={cn(size, "shrink-0 rounded-full")} aria-hidden>
      <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
    </Avatar>
  );

  return (
    // Non-modal: a modal menu with submenus leaves focusable controls under aria-hidden (axe).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 w-full min-w-0 items-center gap-2 rounded-lg px-1.5 text-left text-sm font-medium outline-none",
          "transition-[background-color] duration-(--dur-fast) hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring max-md:min-h-11",
        )}
      >
        {/* 24 px: two 12 px initials fit inside the circle. */}
        {avatar("size-6")}
        {/* Accessible name = visible name + purpose (label in name). */}
        <span className="min-w-0 flex-1 truncate">
          {name}
          <span className="sr-only">, Account menu</span>
        </span>
        <ChevronsUpDown
          className="size-4 shrink-0 text-sidebar-foreground/70"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          {avatar("size-6")}
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            {user?.email ? (
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            ) : null}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun aria-hidden />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={isDark ? "dark" : "light"}
                onValueChange={(v) => {
                  if ((v === "dark") !== isDark) toggleTheme();
                }}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun aria-hidden />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon aria-hidden />
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem asChild>
            <Link to="/settings/account" onClick={() => setOpenMobile(false)}>
              <Settings aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CircleQuestionMark aria-hidden />
            Help
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-48">
            <DropdownMenuItem asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen aria-hidden />
                Documentation{" "}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setOpenMobile(false);
                onShortcuts();
              }}
            >
              <Keyboard aria-hidden />
              Keyboard shortcuts
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
