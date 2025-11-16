import { useEffect, useRef } from 'react';
import { X, Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function AppearanceModal({ isOpen, onClose }) {
  const { theme, setTheme } = useTheme();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap and arrow key navigation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Get radio buttons (theme options)
    const radioButtons = modal.querySelectorAll('[role="radio"]');

    const handleKeyDown = (e) => {
      // Tab key - focus trap
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
        return;
      }

      // Arrow keys - navigate theme options
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const currentIndex = Array.from(radioButtons).findIndex(
          btn => btn === document.activeElement
        );

        // If focus is NOT on a radio button, Down Arrow moves to first option
        if (currentIndex === -1) {
          if (e.key === 'ArrowDown' && radioButtons.length > 0) {
            radioButtons[0].focus();
          }
          return;
        }

        // Navigate between radio buttons
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex + 1 >= radioButtons.length ? 0 : currentIndex + 1;
        } else {
          nextIndex = currentIndex - 1 < 0 ? radioButtons.length - 1 : currentIndex - 1;
        }

        radioButtons[nextIndex].focus();
      }
    };

    modal.addEventListener('keydown', handleKeyDown);
    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor, description: 'Match system' },
  ];

  const handleThemeSelect = (value) => {
    setTheme(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4 sm:pr-6 lg:pr-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-modal-title"
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 id="appearance-modal-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Appearance
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            aria-label="Close appearance settings"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Theme Options */}
        <div className="p-2" role="radiogroup" aria-label="Theme selection">
          {themeOptions.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              onClick={() => handleThemeSelect(value)}
              role="radio"
              aria-checked={theme === value}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset
                ${
                  theme === value
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                {description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {description}
                  </div>
                )}
              </div>
              {theme === value && (
                <Check className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
