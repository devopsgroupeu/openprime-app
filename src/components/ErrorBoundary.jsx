import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// Error display component that can use hooks
const ErrorDisplay = ({ error, errorInfo, onRefresh, onGoHome }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl p-8 shadow-xl border bg-surface border-border">
          <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />

          <h1 className="text-2xl font-bold mb-2 text-primary">
            Something went wrong
          </h1>

          <p className="mb-6 text-secondary">
            An unexpected error occurred. Please try refreshing the page or
            return to the home page.
          </p>

          {((typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
            (typeof process !== "undefined" &&
              process.env?.NODE_ENV === "development")) &&
            error && (
              <details className="text-left mb-6 rounded-lg p-3 text-sm bg-background-secondary text-secondary">
                <summary className="cursor-pointer text-danger mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRefresh}
              className="btn-op-primary flex-1 justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>

            <button
              onClick={onGoHome}
              className="btn-op-secondary flex-1 justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
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
