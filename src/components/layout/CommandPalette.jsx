import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  KeyRound,
  Keyboard,
  Layers,
  Plus,
  SunMoon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { getEffectiveStatus } from "../environment-detail/EnvironmentHeader";
import { SETTINGS_TABS } from "../SettingsPage";
import { DOCS_URL } from "./UserMenu";

export const MOD_KEY =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    ? "⌘"
    : "Ctrl";

const SHORTCUTS = [
  { label: "Open command palette", keys: [MOD_KEY, "K"] },
  { label: "Toggle sidebar", keys: [MOD_KEY, "B"] },
  { label: "Close dialog", keys: ["Esc"] },
];

const NAVIGATE = [
  { label: "Environments", to: "/environments", icon: Layers },
  ...SETTINGS_TABS.map((tab) => ({
    label: tab.label,
    to: `/settings/${tab.id}`,
    icon: tab.icon,
  })),
];

const STATUS_DOT = {
  running: "bg-primary",
  succeeded: "bg-primary",
  failed: "bg-destructive",
  error: "bg-destructive",
};

function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around OpenPrime faster.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{s.label}</span>
              <KbdGroup>
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Cmd/Ctrl+K palette (port of openprime-ai CommandPalette). `environments` is
 * the list App already loaded; nothing is fetched here.
 */
export default function CommandPalette({ open, onOpenChange, environments }) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  const run = (command) => {
    onOpenChange(false);
    command();
  };

  // Plain arrays so later tasks can add items (e.g. current environment).
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
    { label: "Toggle theme", icon: SunMoon, onSelect: toggleTheme },
  ];

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Quick actions"
        description="Search environments, pages and actions"
        className="top-[38%] max-w-2xl"
      >
        {/* `!` beats legacy.css's input[type=text] box (gone in Task 11). */}
        <CommandInput
          placeholder="Search environments or jump to..."
          className="rounded-none! border-0! bg-transparent! px-0! text-sm! shadow-none!"
        />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick actions">
            {quickActions.map(({ label, icon: Icon, onSelect }) => (
              <CommandItem key={label} onSelect={() => run(onSelect)}>
                <Icon />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {environments.length > 0 && (
            <>
              <CommandSeparator />
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
                        "mx-1.5 size-2 shrink-0 rounded-full",
                        STATUS_DOT[getEffectiveStatus(env)] ??
                          "bg-muted-foreground",
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
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Navigate">
            {NAVIGATE.map(({ label, to, icon: Icon }) => (
              <CommandItem
                key={to}
                value={`Go to ${label}`}
                onSelect={() => run(() => navigate(to))}
              >
                <Icon />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem
              value="View documentation help docs"
              onSelect={() =>
                run(() =>
                  window.open(DOCS_URL, "_blank", "noopener,noreferrer"),
                )
              }
            >
              <BookOpen />
              <span>View documentation</span>
            </CommandItem>
            <CommandItem
              value="Keyboard shortcuts keys hotkeys"
              onSelect={() => run(() => setShortcutsOpen(true))}
            >
              <Keyboard />
              <span>Keyboard shortcuts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <span>Navigate with arrow keys, select with Enter</span>
          <span className="flex items-center gap-2">
            <KbdGroup>
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <Kbd>Esc</Kbd>
          </span>
        </div>
      </CommandDialog>

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
