import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

// Feature flag: Authentication not yet implemented (planned for v1.5.0)
const ENABLE_AUTH = false;

export function MobileMenu({ isOpen, onClose, onExamplesClick, onHelpClick }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);

  // Delay enabling click-outside to prevent immediate close on menu open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAllowClickOutside(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAllowClickOutside(false);
    }
  }, [isOpen]);

  // Store previous focus on mount
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Restore focus when menu closes
  useEffect(() => {
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  // Handle Escape key
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

  if (!isOpen) return null;

  const handleExamplesClick = () => {
    onExamplesClick();
    onClose();
  };

  const handleHelpClick = () => {
    onHelpClick();
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself (not the menu content)
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={handleBackdropClick}
      />

      {/* Menu Panel */}
      <div
          data-testid="mobile-menu"
          className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-900">Menu</span>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 hover:bg-slate-100 hover:scale-[1.05] rounded transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600" aria-hidden="true" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            <MenuItem
              onClick={handleExamplesClick}
              onMouseEnter={() => {
                // Preload ExamplesModal on hover to prevent layout shift on first click
                import('./ExamplesModal').catch(() => {});
              }}
            >
              Examples
            </MenuItem>
            <MenuItem
              onClick={handleHelpClick}
              onMouseEnter={() => {
                // Preload HelpModal on hover to prevent layout shift on first click
                import('./HelpModal').catch(() => {});
              }}
            >
              Help & FAQ
            </MenuItem>
          </nav>

          {/* Footer */}
          {ENABLE_AUTH && (
            <div className="p-4 border-t border-slate-200">
              <Button variant="dark" className="w-full">
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MenuItem({ children, onClick, onMouseEnter }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:translate-x-1 rounded-lg transition-all duration-200 motion-reduce:transition-none active:bg-slate-100"
    >
      {children}
    </button>
  );
}