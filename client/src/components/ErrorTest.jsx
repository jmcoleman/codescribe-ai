import { useState } from 'react';
import { Button } from './Button';

/**
 * ErrorBoundary Test Component
 *
 * Intentionally triggers ErrorBoundary to test:
 * - Dark mode styling and theme detection
 * - Error UI layout and responsiveness
 * - Horizontal scrolling for long stack traces
 * - Copy buttons and error details display
 *
 * Access at: /test-error
 * Note: Available in all environments for testing purposes
 */
export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error to trigger ErrorBoundary');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          ErrorBoundary Test
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Click the button below to trigger an error and test the ErrorBoundary UI in dark mode.
        </p>
        <Button
          variant="primary"
          onClick={() => setShouldError(true)}
        >
          Trigger Error
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Make sure you have dark mode enabled to test the dark theme.
        </p>
      </div>
    </div>
  );
}
