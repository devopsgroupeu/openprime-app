import { Fragment } from "react";
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

/**
 * Top bar of the shell (port of openprime-ai TopBar): hairline once the
 * content scrolls, Show sidebar and New environment while the sidebar is
 * hidden, then `breadcrumbs = [{ label, to? }]` (the last one is the page).
 */
export default function AppTopBar({ breadcrumbs = [], scrolled = false }) {
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
                {i > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem className="min-w-0">
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
    </header>
  );
}
