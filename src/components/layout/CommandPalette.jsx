import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { BookOpen, KeyRound, Keyboard, Layers, Moon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { guardedNavigate } from "@/components/shared/save-bar";
import { keyLabels, shortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { getEffectiveStatus, statusDisplay } from "@/utils/environmentStats";
import { SETTINGS_TABS } from "../../config/nav";
import { DOCS_URL } from "./UserMenu";

const NAVIGATE = [
  { label: "Environments", to: "/environments", icon: Layers },
  ...SETTINGS_TABS.map((tab) => ({
    label: tab.label,
    to: `/settings/${tab.id}`,
    icon: tab.icon,
  })),
];

// Dot per status tone (statusDisplay, the same rule as StatusBadge).
const STATUS_DOT = {
  success: "bg-primary",
  destructive: "bg-destructive",
};

/**
 * Puts the open page's own actions in the palette while it shows (AppLayout
 * passes the setter as the outlet context). `group`: { heading, actions }, an
 * action { label, icon, to } (navigates, guarded) or { label, icon, onSelect,
 * disabled }. Re-registered on every render, so the actions stay current.
 */
export function usePaletteActions(group) {
  const setGroup = useOutletContext();
  useEffect(() => {
    setGroup?.(group);
    return () => setGroup?.(null);
  });
}

function Shortcut({ id }) {
  return <CommandShortcut>{keyLabels(shortcut(id)).join(" ")}</CommandShortcut>;
}

/**
 * Command palette (port of openprime-ai CommandPalette): top-anchored search
 * over actions, environments and pages. `environments` is the list App
 * already loaded; nothing is fetched here. `pageActions`: the open page's own
 * group (usePaletteActions).
 */
export default function CommandPalette({
  open,
  onOpenChange,
  onShortcuts,
  environments,
  pageActions,
}) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState("");

  // Every close forgets the query, also Cmd+K toggling it shut in AppLayout.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const run = (command) => {
    onOpenChange(false);
    command();
  };
  // Leaving goes through the page's leave guard (unsaved settings, a running
  // generate job) like a link click does.
  const go = (to, options) => guardedNavigate(() => navigate(to, options), to);

  const quickActions = [
    {
      label: "New environment",
      icon: Plus,
      onSelect: () => go("/environments/create"),
    },
    {
      label: "Add AWS credentials",
      icon: KeyRound,
      onSelect: () =>
        go("/settings/cloud-credentials", {
          state: { addCredential: true },
        }),
    },
    { label: "Toggle theme", icon: Moon, onSelect: toggleTheme },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // max-h-120 for the whole palette, shrinking to its content; the list scrolls inside it.
        className="top-16 flex max-h-120 max-w-[calc(100%-2rem)] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-(--palette-width) md:top-32"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search environments or jump to a page.
          </DialogDescription>
        </DialogHeader>
        <Command
          loop
          className="min-h-0 **:data-[slot=command-input-wrapper]:h-14 **:data-[slot=command-input-wrapper]:px-4 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-item]]:h-10 [&_[cmdk-item]]:rounded-md"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search environments or jump to a page"
            className="text-base"
          />
          <CommandList className="max-h-none min-h-0 p-1">
            <CommandEmpty className="p-0">
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <p role="status" className="text-sm text-muted-foreground">
                  {`No results for "${query.trim()}".`}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </Button>
              </div>
            </CommandEmpty>

            <CommandGroup heading="Quick actions">
              {quickActions.map(({ label, icon: Icon, onSelect }) => (
                <CommandItem key={label} onSelect={() => run(onSelect)}>
                  <Icon aria-hidden />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            {pageActions ? (
              <CommandGroup heading={pageActions.heading}>
                {pageActions.actions.map(
                  ({ label, icon: Icon, to, onSelect, disabled }) => (
                    <CommandItem
                      key={label}
                      disabled={disabled}
                      onSelect={() => run(to ? () => go(to) : onSelect)}
                    >
                      <Icon aria-hidden />
                      {label}
                    </CommandItem>
                  ),
                )}
              </CommandGroup>
            ) : null}

            {environments.length > 0 && (
              <CommandGroup heading="Environments">
                {environments.map((env) => (
                  <CommandItem
                    key={env.id}
                    value={`${env.name} ${env.globalPrefix || env.global_prefix || ""} ${env.region ?? ""} ${env.id}`}
                    onSelect={() => run(() => go(`/environments/${env.id}`))}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mx-1 size-2 shrink-0 rounded-full",
                        STATUS_DOT[
                          statusDisplay(getEffectiveStatus(env)).tone
                        ] ?? "bg-muted-foreground",
                      )}
                    />
                    <span className="truncate">{env.name}</span>
                    {env.region && (
                      <CommandShortcut className="font-mono tracking-normal">
                        {env.region}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Navigate">
              {NAVIGATE.map(({ label, to, icon: Icon }) => (
                <CommandItem
                  key={to}
                  value={`Go to ${label}`}
                  onSelect={() => run(() => go(to))}
                >
                  <Icon aria-hidden />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Help">
              <CommandItem
                value="View documentation help docs"
                onSelect={() =>
                  run(() =>
                    window.open(DOCS_URL, "_blank", "noopener,noreferrer"),
                  )
                }
              >
                <BookOpen aria-hidden />
                View documentation
              </CommandItem>
              <CommandItem
                value="Keyboard shortcuts keys hotkeys"
                onSelect={() => run(onShortcuts)}
              >
                <Keyboard aria-hidden />
                Keyboard shortcuts
                <Shortcut id="shortcutsDialog" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
