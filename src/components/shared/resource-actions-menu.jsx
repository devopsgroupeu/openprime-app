import { MoreHorizontal } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The one "..." menu of a resource (cards, rows, page headers). Callers build `actions` from the
 * DTO `access`, never from the role; destructive items come last, after a separator. An action's
 * optional `className` (e.g. `lg:hidden`) lets a page move header buttons into the menu on small
 * screens; its optional `hint` is a line under the label that says why it is disabled.
 */
export function ResourceActionsMenu({ label, actions, triggerClassName }) {
  const id = useId();
  if (actions.length === 0) return null;
  const regular = actions.filter((a) => !a.destructive);
  const destructive = actions.filter((a) => a.destructive);
  const name = label ?? "More actions";
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={name}
              className={triggerClassName}
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {regular.length > 0 ? (
          <DropdownMenuGroup>
            {regular.map((a, i) => (
              <DropdownMenuItem
                key={a.label}
                onSelect={a.onSelect}
                disabled={a.disabled}
                // The hint stays readable on a disabled item; the label fades.
                aria-label={a.hint ? a.label : undefined}
                aria-describedby={a.hint ? `${id}-${i}` : undefined}
                className={cn(
                  a.hint &&
                    "flex-wrap data-[disabled]:opacity-100 data-[disabled]:*:not-[[data-hint]]:opacity-50",
                  a.className,
                )}
              >
                {a.icon ? <a.icon aria-hidden /> : null}
                {a.hint ? <span>{a.label}</span> : a.label}
                {a.hint ? (
                  <span
                    id={`${id}-${i}`}
                    data-hint
                    className="basis-full pl-6 text-xs text-muted-foreground"
                  >
                    {a.hint}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : null}
        {regular.length > 0 && destructive.length > 0 ? (
          <DropdownMenuSeparator />
        ) : null}
        {destructive.length > 0 ? (
          <DropdownMenuGroup>
            {destructive.map((a) => (
              <DropdownMenuItem
                key={a.label}
                variant="destructive"
                onSelect={a.onSelect}
                disabled={a.disabled}
                className={a.className}
              >
                {a.icon ? <a.icon aria-hidden /> : null}
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
