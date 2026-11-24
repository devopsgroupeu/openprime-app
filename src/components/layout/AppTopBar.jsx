import { Fragment } from "react";
import { Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";

/**
 * Slim top bar inside the sidebar inset (port of openprime-ai PageTopBar).
 * `breadcrumbs = [{ label, to? }]`; the last crumb is the current page. Below
 * md only the last crumb is shown.
 */
export default function AppTopBar({ breadcrumbs = [], actions }) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4!" />

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {breadcrumbs.length > 0 && (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap sm:gap-1.5">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <Fragment key={index}>
                    {index > 0 && (
                      <BreadcrumbSeparator className="max-md:hidden">
                        /
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem
                      className={cn("min-w-0", !isLast && "max-md:hidden")}
                    >
                      {isLast || !crumb.to ? (
                        <BreadcrumbPage
                          className="truncate"
                          title={
                            typeof crumb.label === "string"
                              ? crumb.label
                              : undefined
                          }
                        >
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="whitespace-nowrap">
                          <Link to={crumb.to}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <ThemeToggle />
    </header>
  );
}
