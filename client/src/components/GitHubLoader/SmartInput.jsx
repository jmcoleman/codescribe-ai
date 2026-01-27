/**
 * Smart Input Component
 * URL input with validation and branch selection
 */

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '../Button';
import { validateGitHubUrl } from '../../services/githubService';

export const SmartInput = forwardRef(function SmartInput({ value, onChange, onSubmit, loading, onFocus, onBlur, onClear, fieldError }, ref) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const isValid = value.trim() === '' || validateGitHubUrl(value);
  const showValidationError = touched && !isValid && value.trim() !== '';
  const showError = showValidationError || !!fieldError;

  const handleChange = (newValue) => {
    onChange(newValue);
    // Clear touched state and field error when user starts typing
    if (touched) {
      setTouched(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark as touched to show validation errors
    if (!isValid || !value.trim()) {
      setTouched(true);
      return;
    }

    onSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div>
      <label htmlFor="github-url-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        GitHub username, organization, or repository
      </label>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="github-url-input"
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={onFocus}
            onBlur={(e) => {
              setTouched(true);
              if (onBlur) onBlur(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder="owner, owner/repo, or paste any GitHub URL"
            autoComplete="off"
            className={`w-full pl-4 pr-10 py-2.5 rounded-lg border ${
              showError
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500'
            } ${
              loading
                ? 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            } placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-opacity-50 transition-colors`}
            disabled={loading}
            aria-invalid={showError}
            aria-describedby={showError ? 'github-url-error' : undefined}
          />
          {loading ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
          ) : value.trim() ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (onClear) onClear();
                // Keep input focused after clearing
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={loading || !value.trim() || !isValid}
          className="whitespace-nowrap"
        >
          {loading ? 'Loading...' : 'Load Repository'}
        </Button>
      </form>

      {/* Field-level errors (validation or server 404) */}
      {showError && (
        <div id="github-url-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {fieldError ? (
            // Server-side field error (e.g., 404 not found)
            <p className="font-medium">{fieldError}</p>
          ) : (
            // Client-side validation error
            <>
              <p className="font-medium">Invalid format</p>
              <p className="mt-1">Please use one of these formats:</p>
              <ul className="mt-1 space-y-0.5 text-xs font-mono ml-2">
                <li>• owner (e.g., facebook)</li>
                <li>• owner/repo</li>
                <li>• github.com/owner/repo</li>
                <li>• https://github.com/owner/repo/blob/main/file.js</li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
});
