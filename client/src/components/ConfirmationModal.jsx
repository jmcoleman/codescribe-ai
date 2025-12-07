import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * Reusable confirmation modal with accessibility features
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when user cancels or closes modal
 * @param {Function} props.onConfirm - Called when user confirms action
 * @param {string} props.title - Modal title
 * @param {string|JSX.Element} props.message - Modal message content
 * @param {string} [props.confirmLabel='Confirm'] - Text for confirm button
 * @param {string} [props.cancelLabel='Cancel'] - Text for cancel button
 * @param {string} [props.variant='warning'] - Visual style: 'warning', 'danger', 'info'
 * @param {boolean} [props.closeOnConfirm=true] - Whether to auto-close modal after confirm
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  closeOnConfirm = true
}) {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Focus management - focus cancel button when modal opens (safer default)
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - Esc to close (only if onClose is provided)
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap - keep focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleConfirm = () => {
    if (!onConfirm) return; // Guard against undefined onConfirm
    onConfirm();
    // Only auto-close if closeOnConfirm is true and onClose is provided
    if (closeOnConfirm && onClose) {
      onClose();
    }
  };

  // Variant-specific styling - using brand colors (purple primary, indigo secondary)
  const variantStyles = {
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-slate-100 dark:bg-purple-900/20 ring-2 ring-purple-200 dark:ring-purple-500/50',
      confirmButton: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:active:bg-purple-900 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 shadow-lg shadow-purple-600/20 dark:shadow-purple-900/30 transition-all duration-200'
    },
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
      iconBg: 'bg-slate-100 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-500/50',
      confirmButton: 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:active:bg-red-900 focus-visible:ring-red-600 dark:focus-visible:ring-red-400 shadow-lg shadow-red-600/20 dark:shadow-red-900/30 transition-all duration-200'
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-slate-100 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-500/50',
      confirmButton: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:active:bg-indigo-900 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-900/30 transition-all duration-200'
    }
  };

  const styles = variantStyles[variant] || variantStyles.warning;

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose || undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <div
        ref={modalRef}
        className="modal-container max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 ${styles.iconBg} p-3 rounded-full`}>
              {styles.icon}
            </div>

            {/* Title and close button */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h2 id="confirmation-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="icon-btn interactive-scale-sm focus-ring-light flex-shrink-0"
                    aria-label="Close confirmation modal"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <div id="confirmation-modal-description" className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
            {message}
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
          <button
            type="button"
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={!onClose}
            className={`btn-secondary px-5 py-2.5 shadow-sm ${!onClose ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!onConfirm}
            className={`px-5 py-2.5 text-white rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${styles.confirmButton} ${!onConfirm ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
