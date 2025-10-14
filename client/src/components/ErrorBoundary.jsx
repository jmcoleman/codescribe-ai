import { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the errors, and displays a fallback UI instead of crashing the app.
 *
 * Features:
 * - Catches rendering errors, lifecycle errors, and constructor errors
 * - Displays user-friendly error messages
 * - Provides recovery options (retry, reload, home)
 * - Logs errors for debugging (can be extended to send to monitoring services)
 * - Shows error details in development mode
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  /**
   * Update state to trigger fallback UI
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error details for debugging
   * In production, this should send errors to a monitoring service like Sentry
   */
  componentDidCatch(error, errorInfo) {
    // Log to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // TODO: Send to error monitoring service in production
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Reset error state and try to recover
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the entire page (hard reset)
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Navigate to home (clear state)
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-8">
              {/* Icon and Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-slate-600">
                    {errorCount > 1
                      ? `This error has occurred ${errorCount} times`
                      : 'The application encountered an unexpected error'
                    }
                  </p>
                </div>
              </div>

              {/* User-friendly message */}
              <div className="mb-6">
                <p className="text-slate-700 mb-3">
                  We're sorry for the inconvenience. The application ran into a problem
                  and couldn't continue. Here's what you can try:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                  <li>Try again - sometimes temporary issues resolve themselves</li>
                  <li>Reload the page to start fresh</li>
                  <li>Check your internet connection</li>
                  <li>Clear your browser cache if the problem persists</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical Details (Development only) */}
              {isDevelopment && error && (
                <details className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-slate-900">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Error Message */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-600 mb-1">
                        Error Message:
                      </h3>
                      <pre className="bg-red-50 text-red-800 p-3 rounded text-xs overflow-x-auto border border-red-200">
                        {error.toString()}
                      </pre>
                    </div>

                    {/* Stack Trace */}
                    {error.stack && (
                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 mb-1">
                          Stack Trace:
                        </h3>
                        <pre className="bg-slate-100 text-slate-800 p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto border border-slate-300">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-xs font-semibold text-slate-600 mb-1">
                          Component Stack:
                        </h3>
                        <pre className="bg-slate-100 text-slate-800 p-3 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto border border-slate-300">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Production Error Message */}
              {!isDevelopment && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-600">
                    <strong>Error ID:</strong> {Date.now()}-{Math.random().toString(36).substr(2, 9)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    If this problem continues, please contact support with the error ID above.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center text-sm text-slate-600">
              <p>
                Need help? Check the{' '}
                <a
                  href="https://github.com/yourusername/codescribe-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  documentation
                </a>
                {' '}or{' '}
                <a
                  href="https://github.com/yourusername/codescribe-ai/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  report an issue
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
