/**
 * Smart Input Component
 * URL input with validation and branch selection
 */

import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../Button';
import { validateGitHubUrl } from '../../services/githubService';

export const SmartInput = forwardRef(function SmartInput({ value, onChange, onSubmit, loading }, ref) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const isValid = value.trim() === '' || validateGitHubUrl(value);
  const showError = touched && !isValid && value.trim() !== '';

  const handleChange = (newValue) => {
    onChange(newValue);
    // Clear touched state when user starts typing (encouraging feedback)
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
        GitHub URL or repository
      </label>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="github-url-input"
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={handleKeyDown}
            placeholder="owner/repo/file.js or paste any GitHub URL (file URLs auto-select)"
            autoComplete="off"
            className={`w-full px-4 py-2.5 rounded-lg border ${
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
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
          )}
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

      {/* Client Validation Error */}
      {showError && (
        <div id="github-url-error" className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Invalid GitHub URL</p>
            <p className="mt-1">Please use one of these formats:</p>
            <ul className="mt-1 space-y-0.5 text-xs font-mono ml-2">
              <li>• owner/repo</li>
              <li>• github.com/owner/repo/blob/main/file.js</li>
              <li>• https://github.com/owner/repo</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});
