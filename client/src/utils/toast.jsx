import toast from 'react-hot-toast';
import {
  CustomToast,
  ProgressToast,
  UndoToast,
  PersistentToast,
  CompactToast,
  AvatarToast,
  ExpandableToast,
} from '../components/toast/CustomToast.jsx';

/**
 * Toast notification utility following enterprise-grade best practices
 *
 * Features:
 * - Consistent styling across the application
 * - Accessibility (ARIA support)
 * - Icon support for visual hierarchy
 * - Auto-dismiss with configurable durations
 * - Position control
 * - Promise-based toasts for async operations
 */

/**
 * Default toast configuration
 * Styled to complement CodeScribe AI's brand design system
 * Matches CustomToast component styling for consistency
 */
const DEFAULT_OPTIONS = {
  duration: 4000,
  position: 'top-right',
  className: '', // Allow Tailwind classes
  style: {
    borderRadius: '0.75rem', // 12px - matches CustomToast rounded-xl
    background: 'rgb(255 255 255)', // white for light mode - updated by dark mode media query
    color: 'rgb(15 23 42)', // slate-900 for light mode - updated by dark mode media query
    fontSize: '0.875rem', // 14px - text-sm - CONSISTENT across all toasts
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '400', // font-normal
    padding: '1rem', // 16px - matches CustomToast p-4
    maxWidth: '28rem', // 448px - matches CustomToast max-w-md
    border: '1px solid rgb(226 232 240)', // slate-200 - matches panel borders
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)', // matches CustomToast
    backdropFilter: 'blur(8px)', // matches CustomToast backdrop-blur-sm
    display: 'flex', // Enable flexbox
    alignItems: 'center', // Center icon and text vertically
    gap: '0.75rem', // 12px gap between icon and text
  },
  success: {
    duration: 3000,
    iconTheme: {
      primary: '#16A34A', // green-600 (WCAG AA compliant) - icon indicates success
      secondary: '#FFFFFF', // white background for icon
    },
    style: {
      border: '1px solid rgb(226 232 240)', // slate-200 - matches panel borders
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)', // consistent shadow
      fontSize: '0.875rem', // text-sm - CONSISTENT
      fontWeight: '400', // font-normal - CONSISTENT
    },
  },
  error: {
    duration: 5000,
    iconTheme: {
      primary: '#DC2626', // red-600 (WCAG AA compliant) - icon indicates error
      secondary: '#FFFFFF', // white background for icon
    },
    style: {
      border: '1px solid rgb(226 232 240)', // slate-200 - matches panel borders
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)', // consistent shadow
      fontSize: '0.875rem', // text-sm - CONSISTENT
      fontWeight: '400', // font-normal - CONSISTENT
    },
  },
  loading: {
    iconTheme: {
      primary: '#A855F7', // purple-500 (brand primary) - icon indicates loading
      secondary: '#FFFFFF', // white background for icon
    },
    style: {
      border: '1px solid rgb(226 232 240)', // slate-200 - matches panel borders
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(0, 0, 0, 0.08)', // consistent shadow
      fontSize: '0.875rem', // text-sm - CONSISTENT
      fontWeight: '400', // font-normal - CONSISTENT
    },
  },
};

/**
 * Success toast notification
 *
 * @param {string} message - The message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID for programmatic control
 *
 * @example
 * toastSuccess('Documentation generated successfully!');
 * toastSuccess('File uploaded', { duration: 2000 });
 */
export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...DEFAULT_OPTIONS,
    ...DEFAULT_OPTIONS.success,
    ...options,
  });
};

/**
 * Error toast notification
 *
 * @param {string} message - The error message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID for programmatic control
 *
 * @example
 * toastError('Failed to generate documentation');
 * toastError('Network error', { duration: 6000 });
 */
export const toastError = (message, options = {}) => {
  return toast.error(message, {
    ...DEFAULT_OPTIONS,
    ...DEFAULT_OPTIONS.error,
    ...options,
  });
};

/**
 * Info/default toast notification
 *
 * @param {string} message - The message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID for programmatic control
 *
 * @example
 * toastInfo('Processing your request...');
 */
export const toastInfo = (message, options = {}) => {
  return toast(message, {
    ...DEFAULT_OPTIONS,
    icon: 'ℹ️',
    ...options,
  });
};

/**
 * Loading toast notification
 * Shows a loading spinner with a message
 *
 * @param {string} message - The loading message to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID for updating/dismissing later
 *
 * @example
 * const loadingToast = toastLoading('Generating documentation...');
 * // Later, dismiss it:
 * toast.dismiss(loadingToast);
 */
export const toastLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...DEFAULT_OPTIONS,
    ...DEFAULT_OPTIONS.loading,
    ...options,
  });
};

/**
 * Promise-based toast
 * Automatically shows loading, success, or error states
 *
 * @param {Promise} promise - The promise to track
 * @param {object} messages - Messages for each state
 * @param {object} options - Additional toast options
 * @returns {Promise} The original promise
 *
 * @example
 * await toastPromise(
 *   generateDocumentation(code),
 *   {
 *     loading: 'Generating documentation...',
 *     success: 'Documentation generated successfully!',
 *     error: 'Failed to generate documentation',
 *   }
 * );
 */
export const toastPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'An error occurred',
    },
    {
      ...DEFAULT_OPTIONS,
      success: {
        ...DEFAULT_OPTIONS.success,
        ...options.success,
      },
      error: {
        ...DEFAULT_OPTIONS.error,
        ...options.error,
      },
      loading: {
        ...DEFAULT_OPTIONS.loading,
        ...options.loading,
      },
    }
  );
};

/**
 * Custom toast with fully customizable content
 *
 * @param {string|React.Component} content - Custom content to display
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID for programmatic control
 *
 * @example
 * toastCustom((t) => (
 *   <div>
 *     <strong>Custom Toast</strong>
 *     <button onClick={() => toast.dismiss(t.id)}>Dismiss</button>
 *   </div>
 * ));
 */
export const toastCustom = (content, options = {}) => {
  return toast.custom(content, {
    ...DEFAULT_OPTIONS,
    ...options,
  });
};

/**
 * Dismiss a specific toast by ID
 *
 * @param {string} toastId - The ID of the toast to dismiss
 *
 * @example
 * const id = toastSuccess('Done!');
 * toast.dismiss(id);
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all active toasts
 *
 * @example
 * dismissAllToasts();
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * File upload success toast with file details
 *
 * @param {string} fileName - Name of the uploaded file
 * @param {string} fileSize - Formatted file size
 * @returns {string} Toast ID
 *
 * @example
 * toastFileUploaded('example.js', '2.5 KB');
 */
export const toastFileUploaded = (fileName, fileSize) => {
  return toastSuccess(`${fileName} uploaded successfully (${fileSize})`);
};

/**
 * Documentation generation success
 * Uses compact toast for consistency with other quick notifications
 * Quality score is already visible in DocPanel header
 *
 * @param {string} grade - Quality grade (A, B, C, D, F) - kept for backwards compatibility
 * @param {number} score - Numeric score (0-100) - kept for backwards compatibility
 * @returns {string} Toast ID
 *
 * @example
 * toastDocGenerated('A', 95);
 */
export const toastDocGenerated = (grade, score) => {
  return toastCompact('Documentation ready', 'success');
};

/**
 * Rate limit warning toast
 *
 * @param {number} retryAfter - Seconds until retry is allowed
 * @returns {string} Toast ID
 *
 * @example
 * toastRateLimited(60);
 */
export const toastRateLimited = (retryAfter) => {
  const minutes = Math.ceil(retryAfter / 60);
  return toastError(
    `Request limit reached. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`,
    { duration: 6000 }
  );
};

/**
 * Copy to clipboard success
 *
 * @returns {string} Toast ID
 *
 * @example
 * toastCopied();
 */
export const toastCopied = () => {
  return toastSuccess('Copied to clipboard', { duration: 2000 });
};

/**
 * Network error toast
 *
 * @returns {string} Toast ID
 *
 * @example
 * toastNetworkError();
 */
export const toastNetworkError = () => {
  return toastError('Unable to connect. Please check your network connection and try again.', {
    duration: 5000,
  });
};

/**
 * Action toast with custom buttons
 * Uses CustomToast component for rich interactions
 *
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {Array} actions - Array of action objects { label, onClick, variant, icon }
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * import { Download, Copy } from 'lucide-react';
 *
 * toastWithActions(
 *   'Documentation Ready',
 *   'Would you like to download or copy?',
 *   [
 *     { label: 'Download', onClick: handleDownload, variant: 'primary', icon: Download },
 *     { label: 'Copy', onClick: handleCopy, variant: 'secondary', icon: Copy }
 *   ],
 *   'success'
 * );
 */
export const toastWithActions = (title, message, actions = [], type = 'info', options = {}) => {
  return toast.custom(
    (t) => <CustomToast t={t} type={type} title={title} message={message} actions={actions} />,
    {
      ...DEFAULT_OPTIONS,
      duration: Infinity, // Don't auto-dismiss when there are actions
      ...options,
    }
  );
};

/**
 * Progress toast for long-running operations
 * Shows a progress bar that can be updated
 *
 * @param {string} title - Toast title
 * @param {string} message - Current status message
 * @param {number} progress - Initial progress (0-100)
 * @param {object} options - Additional toast options
 * @returns {object} Object with toastId and update function
 *
 * @example
 * const progressToast = toastProgress('Uploading file', 'Processing...', 0);
 *
 * // Update progress
 * progressToast.update(50, 'Halfway there...');
 *
 * // Complete
 * progressToast.update(100, 'Done!');
 * toast.dismiss(progressToast.toastId);
 */
export const toastProgress = (title, message, progress = 0, options = {}) => {
  let currentProgress = progress;
  let currentMessage = message;

  const toastId = toast.custom(
    (t) => (
      <ProgressToast
        t={t}
        title={title}
        message={currentMessage}
        progress={currentProgress}
        dismissible={false}
      />
    ),
    {
      ...DEFAULT_OPTIONS,
      duration: Infinity,
      ...options,
    }
  );

  return {
    toastId,
    update: (newProgress, newMessage) => {
      currentProgress = newProgress;
      if (newMessage !== undefined) {
        currentMessage = newMessage;
      }
      // Force re-render by updating the toast
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title={title}
            message={currentMessage}
            progress={currentProgress}
            dismissible={false}
          />
        ),
        {
          id: toastId,
          duration: Infinity,
        }
      );
    },
    dismiss: () => toast.dismiss(toastId),
  };
};

/**
 * Undo toast for reversible actions
 * Shows an "Undo" button for a limited time
 *
 * @param {string} message - Action message
 * @param {Function} onUndo - Callback when undo is clicked
 * @param {number} duration - How long to show the toast (ms)
 * @returns {string} Toast ID
 *
 * @example
 * toastUndo('Code cleared', () => {
 *   setCode(previousCode);
 * }, 5000);
 */
export const toastUndo = (message, onUndo, duration = 5000) => {
  return toast.custom(
    (t) => <UndoToast t={t} message={message} onUndo={onUndo} duration={duration} />,
    {
      duration,
    }
  );
};

/**
 * Persistent toast that doesn't auto-dismiss
 * Useful for critical information that requires user acknowledgment
 *
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {Array} actions - Optional action buttons
 * @returns {string} Toast ID
 *
 * @example
 * toastPersistent(
 *   'API Key Missing',
 *   'Please configure your API key to continue.',
 *   'error',
 *   [{ label: 'Configure', onClick: () => navigate('/settings'), variant: 'primary' }]
 * );
 */
export const toastPersistent = (title, message, type = 'info', actions = []) => {
  return toast.custom(
    (t) => (
      <PersistentToast
        t={t}
        type={type}
        title={title}
        message={message}
        actions={actions}
      />
    ),
    {
      duration: Infinity,
    }
  );
};

/**
 * Batch operation toast
 * Shows progress and results for operations affecting multiple items
 *
 * @param {string} title - Operation title
 * @param {number} total - Total items
 * @param {number} completed - Completed items
 * @param {number} failed - Failed items
 * @returns {string} Toast ID
 *
 * @example
 * const batchToast = toastBatch('Processing files', 10, 5, 0);
 * // Update as items complete
 */
export const toastBatch = (title, total, completed = 0, failed = 0) => {
  const progress = (completed / total) * 100;
  const message = `${completed} of ${total} complete${failed > 0 ? `, ${failed} failed` : ''}`;

  if (progress === 100) {
    if (failed > 0) {
      return toastError(`${title} completed with ${failed} error${failed > 1 ? 's' : ''}`, { duration: 5000 });
    } else {
      return toastSuccess(`${title} completed successfully (${total} item${total > 1 ? 's' : ''})`, { duration: 3000 });
    }
  }

  return toastProgress(title, message, progress).toastId;
};

/**
 * Keyboard shortcut toast
 * Shows available keyboard shortcuts
 *
 * @param {string} shortcut - Keyboard shortcut (e.g., 'Cmd+K')
 * @param {string} action - Action description
 * @returns {string} Toast ID
 *
 * @example
 * toastShortcut('Cmd+K', 'Generate documentation');
 */
export const toastShortcut = (shortcut, action) => {
  return toast.custom(
    () => (
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-5 py-3.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center ring-1 ring-white/50 shadow-sm">
          <span className="text-base">⌨️</span>
        </div>
        <kbd className="px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm font-mono tracking-wide">
          {shortcut}
        </kbd>
        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold tracking-tight">{action}</span>
      </div>
    ),
    {
      duration: 2500,
    }
  );
};

/**
 * Feature announcement toast
 * Highlights new features or updates
 *
 * @param {string} title - Feature title
 * @param {string} description - Feature description
 * @param {Function} onLearnMore - Optional callback for "Learn More" action
 * @returns {string} Toast ID
 *
 * @example
 * toastFeature(
 *   'New: GitHub Import',
 *   'You can now import code directly from GitHub repositories!',
 *   () => navigate('/docs/github-import')
 * );
 */
export const toastFeature = (title, description, onLearnMore) => {
  const actions = onLearnMore
    ? [{ label: 'Learn More', onClick: onLearnMore, variant: 'primary' }]
    : [];

  return toastWithActions(title, description, actions, 'info', { duration: 8000 });
};

/**
 * Debug toast (only in development)
 * Useful for debugging without cluttering production
 *
 * @param {string} message - Debug message
 * @param {any} data - Optional data to log
 *
 * @example
 * toastDebug('API Response', responseData);
 */
export const toastDebug = (message, data) => {
  if (import.meta.env.MODE === 'development') {
    console.log(`[Toast Debug] ${message}`, data);
    return toast(
      `🐛 ${message}${data ? ': ' + JSON.stringify(data).substring(0, 50) + '...' : ''}`,
      {
        ...DEFAULT_OPTIONS,
        duration: 3000,
        style: {
          ...DEFAULT_OPTIONS.style,
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          color: '#FFFFFF',
          border: '1px solid #4F46E5',
          boxShadow: '0 20px 50px rgba(99, 102, 241, 0.25), 0 8px 20px rgba(99, 102, 241, 0.15)',
        },
      }
    );
  }
};

/**
 * Compact toast for minimal notifications
 * Shorter duration, no dismiss button
 *
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * toastCompact('Saved!', 'success');
 */
export const toastCompact = (message, type = 'info', options = {}) => {
  return toast.custom(
    (t) => <CompactToast t={t} type={type} message={message} />,
    {
      duration: 2000,
      ...options,
    }
  );
};

/**
 * Avatar toast for notifications with images
 * Great for user actions, system notifications with branding
 *
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} avatarUrl - URL for avatar image
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {Array} actions - Optional action buttons
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * toastAvatar(
 *   'CodeScribe AI',
 *   'Documentation generated successfully!',
 *   '/logo.png',
 *   'success'
 * );
 */
export const toastAvatar = (title, message, avatarUrl, type = 'info', actions = [], options = {}) => {
  return toast.custom(
    (t) => (
      <AvatarToast
        t={t}
        type={type}
        title={title}
        message={message}
        avatarUrl={avatarUrl}
        actions={actions}
      />
    ),
    {
      ...DEFAULT_OPTIONS,
      duration: actions.length > 0 ? Infinity : 4000,
      ...options,
    }
  );
};

/**
 * Expandable toast for notifications with long content
 * Shows preview by default, can expand to show full content
 *
 * @param {string} title - Toast title
 * @param {string} preview - Short preview message
 * @param {string|React.Component} fullContent - Full content to show when expanded
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {Array} actions - Optional action buttons
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * toastExpandable(
 *   'Error Details',
 *   'Failed to generate documentation.',
 *   'Detailed error: API rate limit exceeded. The Claude API returned...',
 *   'error'
 * );
 */
export const toastExpandable = (title, preview, fullContent, type = 'info', actions = [], options = {}) => {
  return toast.custom(
    (t) => (
      <ExpandableToast
        t={t}
        type={type}
        title={title}
        preview={preview}
        fullContent={fullContent}
        actions={actions}
      />
    ),
    {
      ...DEFAULT_OPTIONS,
      duration: actions.length > 0 ? Infinity : 6000,
      ...options,
    }
  );
};

/**
 * Warning toast with action
 * Specialized warning toast with a primary action button
 *
 * @param {string} title - Warning title
 * @param {string} message - Warning message
 * @param {object} action - Primary action { label, onClick, icon }
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * import { RefreshCw } from 'lucide-react';
 *
 * toastWarning(
 *   'Connection Lost',
 *   'The connection to the server was lost.',
 *   { label: 'Retry', onClick: handleRetry, icon: RefreshCw }
 * );
 */
export const toastWarning = (title, message, action = null, options = {}) => {
  const actions = action ? [{ ...action, variant: 'primary' }] : [];
  return toastWithActions(title, message, actions, 'warning', options);
};

/**
 * Confirmation toast with Yes/No actions
 * Shows a persistent toast requiring user confirmation
 *
 * @param {string} title - Confirmation title
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Optional callback when cancelled
 * @param {object} options - Additional toast options
 * @returns {string} Toast ID
 *
 * @example
 * toastConfirm(
 *   'Clear Code?',
 *   'This will remove all code from the editor. Are you sure?',
 *   () => { setCode(''); },
 *   () => { console.log('Cancelled'); }
 * );
 */
export const toastConfirm = (title, message, onConfirm, onCancel = null, options = {}) => {
  return toastWithActions(
    title,
    message,
    [
      {
        label: 'Cancel',
        onClick: () => {
          onCancel?.();
        },
        variant: 'secondary',
      },
      {
        label: 'Confirm',
        onClick: () => {
          onConfirm?.();
        },
        variant: 'danger',
      },
    ],
    'warning',
    options
  );
};

/**
 * Toast queue manager
 * Manages multiple toasts to prevent overwhelming the user
 */
class ToastQueue {
  constructor(maxVisible = 3) {
    this.maxVisible = maxVisible;
    this.queue = [];
  }

  /**
   * Add a toast to the queue
   * @param {Function} toastFn - Toast function to call
   * @param {Array} args - Arguments to pass to toast function
   */
  add(toastFn, ...args) {
    const activeToasts = document.querySelectorAll('[role="alert"], [role="status"]').length;

    if (activeToasts < this.maxVisible) {
      // Show immediately
      return toastFn(...args);
    } else {
      // Queue for later
      this.queue.push({ toastFn, args });
    }
  }

  /**
   * Process next toast in queue (call after dismissing a toast)
   */
  processNext() {
    if (this.queue.length > 0) {
      const { toastFn, args } = this.queue.shift();
      toastFn(...args);
    }
  }

  /**
   * Clear all queued toasts
   */
  clear() {
    this.queue = [];
  }
}

// Export singleton instance
export const toastQueue = new ToastQueue();

/**
 * Group multiple toasts by ID
 * Only shows the latest toast from each group
 */
const toastGroups = new Map();

/**
 * Show grouped toast
 * Automatically dismisses previous toast in the same group
 *
 * @param {string} groupId - Unique group identifier
 * @param {Function} toastFn - Toast function to call
 * @param {Array} args - Arguments to pass to toast function
 * @returns {string} Toast ID
 *
 * @example
 * // Only the latest API error will be shown
 * toastGrouped('api-error', toastError, 'Connection failed');
 * toastGrouped('api-error', toastError, 'Timeout occurred'); // Replaces previous
 */
export const toastGrouped = (groupId, toastFn, ...args) => {
  // Dismiss previous toast in this group
  if (toastGroups.has(groupId)) {
    toast.dismiss(toastGroups.get(groupId));
  }

  // Show new toast and store its ID
  const toastId = toastFn(...args);
  toastGroups.set(groupId, toastId);

  return toastId;
};

/**
 * Clear all toasts in a group
 *
 * @param {string} groupId - Group identifier
 *
 * @example
 * clearToastGroup('api-error');
 */
export const clearToastGroup = (groupId) => {
  if (toastGroups.has(groupId)) {
    toast.dismiss(toastGroups.get(groupId));
    toastGroups.delete(groupId);
  }
};

// Export the base toast object for advanced usage
export { toast };
