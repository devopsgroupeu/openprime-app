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
                aria-label={a.hint ? a.label : undefined}
                aria-describedby={a.hint ? `${id}-${i}` : undefined}
                // The hint stays readable on a disabled item; icon and label fade.
                className={cn(
                  a.hint &&
                    "items-start data-[disabled]:opacity-100 data-[disabled]:[&>svg]:opacity-50 [&>svg]:mt-0.5",
                  a.className,
                )}
              >
                {a.icon ? <a.icon aria-hidden /> : null}
                {a.hint ? (
                  <span className="flex flex-col gap-0.5">
                    <span className="in-data-[disabled]:opacity-50">
                      {a.label}
                    </span>
                    <span
                      id={`${id}-${i}`}
                      className="max-w-52 text-xs text-muted-foreground"
                    >
                      {a.hint}
                    </span>
                  </span>
                ) : (
                  a.label
                )}
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
