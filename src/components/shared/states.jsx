// Page and section states: empty, error, NotFound and the edge-page frame.
import { ArrowLeft, FileQuestion, Inbox, Search } from "lucide-react";
import { createElement } from "react";
import { Link } from "react-router";

import symbol from "@/assets/openprime-symbol-color.svg";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";

const DASHED = "border border-dashed border-input";

/**
 * First run: dashed box, 44 px icon tile, what goes here (+ an example or the formats) and one
 * action. Filtered: the same box with a Search tile, "Try a different keyword..." and a clear
 * button, so a list is never a dead end.
 */
export function EmptyState(props) {
  if (props.variant === "filtered") {
    return (
      <Empty data-slot="empty-state" data-variant="filtered" className={DASHED}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{props.title ?? "No results found"}</EmptyTitle>
          <EmptyDescription>
            {props.description ??
              "Try a different keyword or clear the filters."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" size="sm" onClick={props.onClearFilters}>
            {props.clearLabel ?? "Clear filters"}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <Empty data-slot="empty-state" data-variant="first-run" className={DASHED}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {/* createElement: callers pass stable module-level components. */}
          {createElement(props.icon ?? Inbox, { "aria-hidden": true })}
        </EmptyMedia>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.description}</EmptyDescription>
      </EmptyHeader>
      {props.action ? <EmptyContent>{props.action}</EmptyContent> : null}
    </Empty>
  );
}

/**
 * "Couldn't load <thing>." + "Try again", announced politely. The server's
 * `message` and `requestId` (the support handle) show under the title.
 */
export function ErrorState({
  thing,
  onRetry,
  retrying = false,
  message,
  requestId,
}) {
  return (
    <div role="status" aria-live="polite" data-slot="error-state">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{`Couldn't load ${thing}.`}</EmptyTitle>
          {message ? (
            <EmptyDescription className="wrap-break-word">
              {message}
            </EmptyDescription>
          ) : null}
          {requestId ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              Error ID <span className="font-mono">{requestId}</span>
              <CopyButton
                text={requestId}
                label="Copy error ID"
                size="icon-xs"
              />
            </p>
          ) : null}
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
          >
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

/**
 * Missing or ungranted resource: existence is never revealed. `title` replaces
 * the sentence (an unknown URL reads "Page not found"); the tab reads
 * "<Thing> not found".
 */
export function NotFound({ thing = "page", title }) {
  const heading =
    title ?? `This ${thing} doesn't exist or you don't have access.`;
  useDocumentTitle(`${thing[0].toUpperCase()}${thing.slice(1)} not found`);
  return (
    <Empty data-slot="not-found" className="min-h-80">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion aria-hidden />
        </EmptyMedia>
        {/* A page in this state has no other h1. */}
        <h1 className="text-xl font-semibold">{heading}</h1>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="secondary" asChild>
          <Link to="/environments">
            <ArrowLeft aria-hidden />
            Back to environments
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/**
 * Frame of the auth and edge pages: centered 400 px column, mark, h1, text and actions.
 * `loading` turns the title into a quiet one-line wait with a spinner ("Signing you in...").
 */
export function FullScreenState({
  logo,
  loading = false,
  title,
  description,
  primary,
  secondary,
  children,
  className,
}) {
  return (
    <main
      data-slot="full-screen-state"
      aria-busy={loading || undefined}
      className={cn(
        "flex min-h-dvh items-center justify-center bg-background px-4 py-12",
        className,
      )}
    >
      <div className="flex w-full max-w-100 flex-col items-center gap-6 text-center">
        {logo ? <img src={symbol} alt="OpenPrime" className="size-10" /> : null}
        <div className="flex flex-col gap-1.5">
          {loading ? (
            <h1 className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner aria-hidden />
              {title}
            </h1>
          ) : (
            <h1 className="text-xl font-semibold text-balance">{title}</h1>
          )}
          {description ? (
            <p className="text-sm text-balance text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="w-full text-left">{children}</div> : null}
        {primary || secondary ? (
          <div className="flex w-full flex-col gap-2">
            {primary}
            {secondary}
          </div>
        ) : null}
      </div>
    </main>
  );
}
