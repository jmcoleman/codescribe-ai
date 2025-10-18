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
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning'
}) {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Focus management - focus cancel button when modal opens (safer default)
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - Esc to close
  useEffect(() => {
    if (!isOpen) return;

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
    onConfirm();
    onClose();
  };

  // Variant-specific styling - using brand colors (purple primary, indigo secondary)
  const variantStyles = {
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-purple-600" />,
      iconBg: 'bg-slate-100 ring-2 ring-purple-200',
      confirmButton: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus:ring-purple-600 shadow-sm hover:shadow transition-all duration-200'
    },
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-slate-100 ring-2 ring-red-200',
      confirmButton: 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-600 shadow-sm hover:shadow transition-all duration-200'
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6 text-indigo-600" />,
      iconBg: 'bg-slate-100 ring-2 ring-indigo-200',
      confirmButton: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-600 shadow-sm hover:shadow transition-all duration-200'
    }
  };

  const styles = variantStyles[variant] || variantStyles.warning;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
              <div className="flex items-start justify-between gap-2">
                <h2 id="confirmation-modal-title" className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  aria-label="Close confirmation modal"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <div id="confirmation-modal-description" className="text-slate-700 leading-relaxed space-y-4">
            {message}
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
          <button
            type="button"
            ref={cancelButtonRef}
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 hover:bg-white hover:border-slate-300 border border-slate-200 bg-white rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmButton}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
