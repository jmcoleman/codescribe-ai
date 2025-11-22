import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal Component
 *
 * Custom confirmation modal matching brand palette and UX guidelines.
 * Replaces native browser confirm() dialogs.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Called when modal should close (cancel/backdrop)
 * @param {Function} props.onConfirm - Called when user confirms action
 * @param {string} props.title - Modal title
 * @param {string} props.message - Main message text
 * @param {string} props.warning - Optional warning text (displayed with AlertTriangle icon)
 * @param {string} props.confirmText - Confirm button text (default: "Confirm")
 * @param {string} props.cancelText - Cancel button text (default: "Cancel")
 * @param {string} props.variant - Variant: 'danger' | 'warning' | 'info' (default: 'info')
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}) {
  const confirmButtonRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleConfirm = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    onConfirm();
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  // Variant styles
  const variantStyles = {
    danger: {
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800',
      confirmBtn: 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white focus-visible:ring-red-500',
      warningBox: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 dark:border-l-red-400',
      warningText: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-800 text-white focus-visible:ring-amber-500',
      warningBox: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-500 dark:border-l-amber-400',
      warningText: 'text-amber-700 dark:text-amber-300'
    },
    info: {
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800',
      confirmBtn: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 text-white focus-visible:ring-purple-500',
      warningBox: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 border-l-4 border-l-purple-500 dark:border-l-purple-400',
      warningText: 'text-purple-700 dark:text-purple-300'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <AlertTriangle className={`w-4 h-4 ${styles.icon}`} aria-hidden="true" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Message */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {message}
          </p>

          {/* Warning (if provided) */}
          {warning && (
            <div className={`p-3 ${styles.warningBox} rounded-lg mb-4`}>
              <p className={`text-sm ${styles.warningText} leading-relaxed`}>
                <strong className="font-semibold">Warning:</strong> {warning}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
