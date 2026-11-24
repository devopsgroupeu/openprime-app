import { Fragment } from "react";
import { Link } from "react-router";
import { Check, PanelRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import symbol from "../../assets/openprime-symbol-color.svg";

const time = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Top bar of the full-screen wizard: symbol, `breadcrumbs = [{ label, to? }]`
 * (the first one is dropped below sm), draft status, the Aura toggles and
 * Cancel. `auraOpen` drives the xl column toggle; below xl `auraSheet` (a
 * SheetTrigger) opens Aura as a sheet instead.
 */
export default function WizardTopBar({
  breadcrumbs,
  savedAt,
  auraOpen,
  onToggleAura,
  auraSheet,
  onCancel,
}) {
  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b px-2 sm:px-3">
      <Link
        to="/environments"
        aria-label="OpenPrime home"
        className="flex shrink-0 items-center rounded-md p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img src={symbol} alt="" className="size-5" />
      </Link>
      <Breadcrumb aria-label="Breadcrumb" className="min-w-0 flex-1 px-1">
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
                {crumb.to ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to} className="truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex shrink-0 items-center gap-1">
        {savedAt ? (
          <p className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <Check className="size-3.5" aria-hidden />
            Draft saved{" "}
            <time dateTime={new Date(savedAt).toISOString()}>
              {time(savedAt)}
            </time>
          </p>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={auraOpen}
          onClick={onToggleAura}
          className="hidden xl:inline-flex"
        >
          <PanelRight aria-hidden />
          Aura
        </Button>
        {auraSheet}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </header>
  );
}
