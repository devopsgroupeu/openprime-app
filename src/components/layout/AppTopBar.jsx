import { Fragment, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { PanelLeft, Plus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { IconAction } from "./IconAction";

// The element at the right end of the top bar (AppLayout provides it).
export const TopBarSlot = createContext(null);

/**
 * Puts the open page's own controls at the right end of the shell top bar
 * (the wizard's draft status, Aura and Cancel), like openprime-ai's header
 * slot. Renders nothing outside the shell.
 */
export function TopBarActions({ children }) {
  const slot = useContext(TopBarSlot);
  return slot ? createPortal(children, slot) : null;
}

/**
 * Top bar of the shell (port of openprime-ai TopBar): hairline once the
 * content scrolls, Show sidebar and New environment while the sidebar is
 * hidden, then `breadcrumbs = [{ label, to? }]` (the last one is the page;
 * the first one is dropped below sm, where the sidebar sheet has it) and, at
 * the right end, `actionsRef`: the slot of TopBarActions.
 */
export default function AppTopBar({
  breadcrumbs = [],
  scrolled = false,
  actionsRef,
}) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const collapsed = isMobile || state === "collapsed";

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "flex h-13 shrink-0 items-center gap-1 border-b border-transparent px-2",
        "transition-[border-color] duration-(--dur-fast) data-scrolled:border-border",
      )}
    >
      {collapsed ? (
        <>
          <IconAction
            label="Show sidebar"
            icon={PanelLeft}
            shortcutId="toggleSidebar"
            onClick={toggleSidebar}
          />
          <IconAction
            label="New environment"
            icon={Plus}
            to="/environments/create"
          />
        </>
      ) : null}
      {breadcrumbs.length > 0 ? (
        <Breadcrumb aria-label="Breadcrumb" className="min-w-0 px-1">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 ? (
                  <BreadcrumbSeparator
                    className={cn(i === 1 && "max-sm:hidden")}
                  />
                ) : null}
                <BreadcrumbItem
                  className={cn("min-w-0", i === 0 && "max-sm:hidden")}
                >
                  {i === breadcrumbs.length - 1 || !crumb.to ? (
                    <BreadcrumbPage className="truncate">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to} className="truncate">
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div
        ref={actionsRef}
        className="ml-auto flex shrink-0 items-center gap-1 empty:hidden"
      />
    </header>
  );
}
