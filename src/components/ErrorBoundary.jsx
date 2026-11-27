import React from "react";
import { Link } from "react-router";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { FullScreenState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { useDocumentTitle } from "@/hooks/use-document-title";

const isDev = () =>
  (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
  (typeof process !== "undefined" && process.env?.NODE_ENV === "development");

// In development, the error itself.
const ErrorDetails = ({ error, errorInfo }) =>
  isDev() && error ? (
    <details className="w-full rounded-lg border bg-muted/40 p-3 text-left text-xs">
      <summary className="cursor-pointer font-medium text-destructive">
        Error details (development)
      </summary>
      <pre className="mt-2 max-h-60 overflow-auto font-mono whitespace-pre-wrap text-muted-foreground">
        {error.toString()}
        {errorInfo?.componentStack}
      </pre>
    </details>
  ) : null;

/**
 * A page that crashed, in the content area of the shell (openprime-ai's
 * in-shell error): the sidebar and top bar stay. Reload, or back to the list.
 */
export function PageCrash({ error, errorInfo, resetError }) {
  useDocumentTitle("Something went wrong");
  return (
    <PageShell width="detail">
      <Empty role="alert" className="min-h-80">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert aria-hidden />
          </EmptyMedia>
          {/* A page in this state has no other h1. */}
          <h1 className="text-xl font-semibold">Something went wrong.</h1>
          <EmptyDescription>Reload the page to try again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button variant="secondary" asChild>
              {/* Also from the list itself, where the route stays. */}
              <Link to="/environments" onClick={resetError}>
                <ArrowLeft aria-hidden />
                Back to environments
              </Link>
            </Button>
          </div>
          <ErrorDetails error={error} errorInfo={errorInfo} />
        </EmptyContent>
      </Empty>
    </PageShell>
  );
}

// The last-resort crash screen of the shell itself (openprime-ai
// global-error): what happened, Reload, and in development the error itself.
const ErrorDisplay = ({ error, errorInfo, onRefresh, onGoHome }) => {
  return (
    <FullScreenState
      logo
      title="Something went wrong."
      description="Reload the page to try again."
      primary={
        <Button size="lg" onClick={onRefresh}>
          Reload
        </Button>
      }
      secondary={
        <Button variant="ghost" size="lg" onClick={onGoHome}>
          Go to environments
        </Button>
      }
    >
      <ErrorDetails error={error} errorInfo={errorInfo} />
    </FullScreenState>
  );
};

/**
 * Catches a render crash below it. `fallback` replaces the crashed tree (it
 * gets `error`, `errorInfo` and `resetError`); without one, the full-screen
 * crash screen. A change of `resetKey` (the route) clears the crash without
 * remounting the tree.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: props.resetKey,
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey
      ? null
      : {
          hasError: false,
          error: null,
          errorInfo: null,
          resetKey: props.resetKey,
        };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    if (isDev()) {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
          />
        );
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRefresh={() => window.location.reload()}
          onGoHome={() => (window.location.href = "/")}
        />
      );
    }

    return this.props.children;
  }
}

// Custom hook for functional components to handle errors
export const useErrorHandler = () => {
  return (error) => {
    // In a real app, you might want to log this to an error reporting service
    console.error("Error caught:", error);
    throw error; // Re-throw to be caught by Error Boundary
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorFallback) => {
  return (props) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
