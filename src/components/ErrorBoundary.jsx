import React from "react";
import { FullScreenState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

// The crash screen (openprime-ai global-error): what happened, Reload, and in
// development the error itself.
const ErrorDisplay = ({ error, errorInfo, onRefresh, onGoHome }) => {
  const isDev =
    (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development");
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
      {isDev && error ? (
        <details className="rounded-lg border bg-muted/40 p-3 text-xs">
          <summary className="cursor-pointer font-medium text-destructive">
            Error details (development)
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto font-mono whitespace-pre-wrap text-muted-foreground">
            {error.toString()}
            {errorInfo?.componentStack}
          </pre>
        </details>
      ) : null}
    </FullScreenState>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
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
    const isDev =
      (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
      (typeof process !== "undefined" &&
        process.env?.NODE_ENV === "development");
    if (isDev) {
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
            resetError={() => this.setState({ hasError: false })}
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
