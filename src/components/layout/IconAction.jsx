import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { keyLabels, shortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

/** Shortcut keys as chips (port of openprime-ai ShortcutKeys). */
export function ShortcutKeys({ id, className }) {
  return (
    <KbdGroup aria-hidden className={className}>
      {keyLabels(shortcut(id)).map((k) => (
        <Kbd key={k}>{k}</Kbd>
      ))}
    </KbdGroup>
  );
}

/** Icon-only shell button with a tooltip naming it and its shortcut (inside SidebarProvider). */
export function IconAction({
  label,
  icon: Icon,
  shortcutId,
  to,
  onClick,
  className,
}) {
  const { isMobile } = useSidebar();
  const icon = <Icon aria-hidden />;
  return (
    // Below md (touch, sidebar as a sheet) no tooltip, like the sidebar's own
    // menu buttons: the sheet focuses Search on open and would pop its hint.
    <Tooltip open={isMobile ? false : undefined}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={cn("text-current", className)}
          onClick={onClick}
          asChild={to !== undefined}
        >
          {to !== undefined ? <Link to={to}>{icon}</Link> : icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        {shortcutId ? <ShortcutKeys id={shortcutId} /> : null}
      </TooltipContent>
    </Tooltip>
  );
}
