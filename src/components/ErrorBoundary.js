import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// Error display component that can use hooks
const ErrorDisplay = ({ error, errorInfo, onRefresh, onGoHome }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-8 ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-md w-full text-center">
        <div
          className={`rounded-lg p-8 shadow-xl border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />

          <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Something went wrong
          </h1>

          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            An unexpected error occurred. Please try refreshing the page or return to the home page.
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details
              className={`text-left mb-6 rounded p-3 text-sm ${
                isDark ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <summary className="cursor-pointer text-red-400 mb-2">
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
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>

            <button
              onClick={onGoHome}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
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
    if (process.env.NODE_ENV === "development") {
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
