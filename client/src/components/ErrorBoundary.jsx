import { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { CopyButton } from './CopyButton';
import { STORAGE_KEYS } from '../constants/storage';
import { formatDateTime } from '../utils/formatters';

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
 * - Shows error details in development mode with copy buttons for easy sharing
 * - Copy functionality for error message, stack trace, and component stack
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

    // Apply dark mode immediately when error is caught
    const isDark = this.getThemePreference() === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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

  /**
   * Detect theme preference
   * Since ErrorBoundary wraps ThemeProvider, we need to detect theme ourselves
   */
  getThemePreference = () => {
    // Priority: localStorage > system preference > default
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      if (stored) return stored;
    } catch (e) {
      // localStorage not available
    }

    // Check system preference
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // matchMedia not available
    }

    return 'light';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;
      const isDark = this.getThemePreference() === 'dark';

      // Ensure dark class is applied to html element
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full min-w-0">
            {/* Error Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 border-red-200 dark:border-red-800 p-8">
              {/* Icon and Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center border-2 border-transparent dark:border-red-800/50">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {errorCount > 1
                      ? `This error has occurred ${errorCount} times. Consider reloading the page.`
                      : 'An unexpected error occurred'
                    }
                  </p>
                </div>
              </div>

              {/* User-friendly message */}
              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  We apologize for the disruption. Something unexpected happened.
                  Here's what you can try:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                  <li>Click "Try Again" to retry your action</li>
                  <li>Refresh the page to restart the application</li>
                  <li>If the issue continues, try clearing your browser cache and cookies</li>
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
                <details className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 group">
                  <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Error Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Error Message:
                        </h3>
                        <CopyButton
                          text={error.toString()}
                          size="sm"
                          variant="outline"
                          ariaLabel="Copy error message"
                        />
                      </div>
                      <pre className="bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 p-3 rounded text-xs border border-red-200 dark:border-red-700/50 font-mono whitespace-pre overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>

                    {/* Stack Trace */}
                    {error.stack && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Stack Trace:
                          </h3>
                          <CopyButton
                            text={error.stack}
                            size="sm"
                            variant="outline"
                            ariaLabel="Copy stack trace"
                          />
                        </div>
                        <pre className="bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 p-3 rounded text-xs border border-slate-300 dark:border-slate-600/50 font-mono whitespace-pre overflow-x-auto max-h-48 overflow-y-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Component Stack:
                          </h3>
                          <CopyButton
                            text={errorInfo.componentStack}
                            size="sm"
                            variant="outline"
                            ariaLabel="Copy component stack"
                          />
                        </div>
                        <pre className="bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 p-3 rounded text-xs border border-slate-300 dark:border-slate-600/50 font-mono whitespace-pre overflow-x-auto max-h-48 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Production Error Message */}
              {!isDevelopment && (() => {
                const errorId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                const timestamp = formatDateTime(new Date());
                return (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Error Reference
                      </p>
                      <CopyButton
                        text={errorId}
                        size="sm"
                        variant="outline"
                        ariaLabel="Copy error ID"
                      />
                    </div>
                    <p className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 mb-2">
                      {errorId}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Occurred at: {timestamp}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      If this error persists, please report it on{' '}
                      <a
                        href="https://github.com/yourusername/codescribe-ai/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                      >
                        GitHub
                      </a>
                      {' '}and include this error reference.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              <p>
                Need more help? Check our{' '}
                <a
                  href="https://github.com/yourusername/codescribe-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                >
                  documentation
                </a>
                {' '}for troubleshooting tips or{' '}
                <a
                  href="https://github.com/yourusername/codescribe-ai/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline"
                >
                  report this issue on GitHub
                </a>
                .
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
