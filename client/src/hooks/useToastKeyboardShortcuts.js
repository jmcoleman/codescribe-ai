import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Toast Keyboard Shortcuts Hook
 *
 * Provides enterprise-grade keyboard shortcuts for toast management,
 * enhancing accessibility and power-user productivity.
 *
 * Keyboard Shortcuts:
 * - Escape: Dismiss all toasts
 * - Ctrl/Cmd + Shift + K: Clear all toasts
 * - Ctrl/Cmd + Shift + N: Open notification center (when ToastHistory is available)
 * - Tab: Navigate between toast action buttons
 * - Enter/Space: Activate focused toast button
 *
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Enable/disable shortcuts (default: true)
 * @param {Function} options.onOpenNotificationCenter - Callback for notification center shortcut
 * @param {boolean} options.enableEscapeDismiss - Enable Escape to dismiss all (default: true)
 * @param {boolean} options.enableClearAll - Enable Ctrl/Cmd+Shift+K (default: true)
 *
 * @example
 * function App() {
 *   const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
 *
 *   useToastKeyboardShortcuts({
 *     onOpenNotificationCenter: () => setNotificationCenterOpen(true),
 *   });
 *
 *   return <div>...</div>;
 * }
 */
export const useToastKeyboardShortcuts = (options = {}) => {
  const {
    enabled = true,
    onOpenNotificationCenter = null,
    enableEscapeDismiss = true,
    enableClearAll = true,
    enableDebugMode = false,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Escape: Dismiss all toasts
      if (enableEscapeDismiss && event.key === 'Escape') {
        const activeToasts = document.querySelectorAll('[role="alert"], [role="status"]');
        if (activeToasts.length > 0) {
          toast.dismiss();
          event.preventDefault();
          event.stopPropagation();

          if (enableDebugMode) {
            console.log('[Toast Shortcuts] Dismissed all toasts (Escape)');
          }
        }
      }

      // Ctrl/Cmd + Shift + K: Clear all toasts
      if (enableClearAll && modifierKey && event.shiftKey && event.key === 'K') {
        toast.dismiss();
        event.preventDefault();
        event.stopPropagation();

        if (enableDebugMode) {
          console.log('[Toast Shortcuts] Cleared all toasts (Ctrl/Cmd+Shift+K)');
        }
      }

      // Ctrl/Cmd + Shift + N: Open notification center
      if (onOpenNotificationCenter && modifierKey && event.shiftKey && event.key === 'N') {
        onOpenNotificationCenter();
        event.preventDefault();
        event.stopPropagation();

        if (enableDebugMode) {
          console.log('[Toast Shortcuts] Opened notification center (Ctrl/Cmd+Shift+N)');
        }
      }

      // Alt + T: Show keyboard shortcuts help
      if (event.altKey && event.key === 't') {
        showKeyboardShortcutsHelp();
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    onOpenNotificationCenter,
    enableEscapeDismiss,
    enableClearAll,
    enableDebugMode,
  ]);
};

/**
 * Show keyboard shortcuts help toast
 */
const showKeyboardShortcutsHelp = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  toast(
    (t) => (
      <div className="max-w-md">
        <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <span className="text-lg">⌨️</span>
          Toast Keyboard Shortcuts
        </div>
        <div className="space-y-2 text-sm">
          <ShortcutRow shortcut="Esc" description="Dismiss all toasts" />
          <ShortcutRow shortcut={`${modKey}+Shift+K`} description="Clear all toasts" />
          <ShortcutRow shortcut={`${modKey}+Shift+N`} description="Open notification center" />
          <ShortcutRow shortcut="Tab" description="Navigate toast buttons" />
          <ShortcutRow shortcut="Alt+T" description="Show this help" />
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-3 w-full px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Got it
        </button>
      </div>
    ),
    {
      duration: 10000,
      style: {
        background: '#fff',
        color: '#0F172A',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
    }
  );
};

/**
 * Keyboard shortcut row component
 */
const ShortcutRow = ({ shortcut, description }) => (
  <div className="flex items-center justify-between gap-3">
    <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded shadow-sm">
      {shortcut}
    </kbd>
    <span className="text-slate-600 text-xs flex-1">{description}</span>
  </div>
);

/**
 * Hook to manage focus within toast notifications
 * Automatically focuses the first focusable element in toasts with actions
 */
export const useToastFocusManagement = () => {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches('[role="alert"], [role="status"]')) {
            // Find first focusable element (button, link, input)
            const focusable = node.querySelector(
              'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            // Focus the first button if toast has actions
            if (focusable && node.querySelector('button[class*="action"]')) {
              setTimeout(() => {
                focusable.focus();
              }, 100);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

/**
 * Hook to announce toasts to screen readers
 * Ensures proper ARIA live region announcements
 */
export const useToastScreenReaderAnnouncements = () => {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches('[role="alert"], [role="status"]')) {
            // Ensure proper ARIA attributes
            if (!node.hasAttribute('aria-live')) {
              const isAlert = node.getAttribute('role') === 'alert';
              node.setAttribute('aria-live', isAlert ? 'assertive' : 'polite');
            }

            if (!node.hasAttribute('aria-atomic')) {
              node.setAttribute('aria-atomic', 'true');
            }

            // Add describedby for screen readers if there's a message
            const message = node.querySelector('[class*="message"]');
            if (message && !message.id) {
              const id = `toast-message-${Date.now()}`;
              message.id = id;
              node.setAttribute('aria-describedby', id);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};

/**
 * Hook to prevent toast overflow
 * Limits the number of visible toasts to prevent UI clutter
 */
export const useToastOverflowPrevention = (maxVisible = 3) => {
  useEffect(() => {
    const checkToastCount = () => {
      const toasts = document.querySelectorAll('[role="alert"], [role="status"]');

      if (toasts.length > maxVisible) {
        // Dismiss oldest toasts
        const toastsToDismiss = Array.from(toasts).slice(0, toasts.length - maxVisible);
        toastsToDismiss.forEach((toastElement) => {
          const dismissButton = toastElement.querySelector('[aria-label*="Dismiss"]');
          if (dismissButton) {
            dismissButton.click();
          }
        });
      }
    };

    // Check on interval
    const interval = setInterval(checkToastCount, 500);

    return () => {
      clearInterval(interval);
    };
  }, [maxVisible]);
};

/**
 * Complete toast accessibility hook
 * Combines all accessibility enhancements
 */
export const useToastAccessibility = (options = {}) => {
  useToastKeyboardShortcuts(options);
  useToastFocusManagement();
  useToastScreenReaderAnnouncements();
  useToastOverflowPrevention(options.maxVisible);
};

export default useToastKeyboardShortcuts;
