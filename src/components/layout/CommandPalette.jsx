import { useState } from "react";
import { useNavigate } from "react-router";
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
import { keyLabels, shortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { getEffectiveStatus, statusDisplay } from "@/utils/environmentStats";
import { SETTINGS_TABS } from "../SettingsPage";
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

function Shortcut({ id }) {
  return <CommandShortcut>{keyLabels(shortcut(id)).join(" ")}</CommandShortcut>;
}

/**
 * Command palette (port of openprime-ai CommandPalette): top-anchored search
 * over actions, environments and pages. `environments` is the list App
 * already loaded; nothing is fetched here.
 */
export default function CommandPalette({
  open,
  onOpenChange,
  onShortcuts,
  environments,
}) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState("");

  const setOpen = (next) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };
  const run = (command) => {
    setOpen(false);
    command();
  };

  const quickActions = [
    {
      label: "New environment",
      icon: Plus,
      onSelect: () => navigate("/environments/create"),
    },
    {
      label: "Add AWS credentials",
      icon: KeyRound,
      onSelect: () =>
        navigate("/settings/cloud-credentials", {
          state: { addCredential: true },
        }),
    },
    { label: "Toggle theme", icon: Moon, onSelect: toggleTheme },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {/* `!` beats legacy.css's input[type=text] box (gone in Task 11). */}
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search environments or jump to a page"
            className="rounded-none! border-0! bg-transparent! px-0! text-base! shadow-none!"
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

            {environments.length > 0 && (
              <CommandGroup heading="Environments">
                {environments.map((env) => (
                  <CommandItem
                    key={env.id}
                    value={`${env.name} ${env.globalPrefix || env.global_prefix || ""} ${env.region ?? ""} ${env.id}`}
                    onSelect={() =>
                      run(() => navigate(`/environments/${env.id}`))
                    }
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
                  onSelect={() => run(() => navigate(to))}
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
