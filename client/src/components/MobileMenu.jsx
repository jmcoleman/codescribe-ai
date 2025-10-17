import { X } from 'lucide-react';
import { Button } from './Button';

export function MobileMenu({ isOpen, onClose, onExamplesClick, onHelpClick }) {
  if (!isOpen) return null;

  const handleExamplesClick = () => {
    onExamplesClick();
    onClose();
  };

  const handleHelpClick = () => {
    onHelpClick();
    onClose();
  };

  const handleGitHubClick = () => {
    window.open('https://github.com/yourusername/codescribe-ai', '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div data-testid="mobile-menu" className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-900">Menu</span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 hover:scale-[1.05] rounded transition-all duration-200 motion-reduce:transition-none active:scale-[0.98]"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600" />
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
            <MenuItem onClick={handleGitHubClick}>GitHub Repo</MenuItem>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button variant="dark" className="w-full">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MenuItem({ children, onClick, onMouseEnter }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:translate-x-1 rounded-lg transition-all duration-200 motion-reduce:transition-none active:bg-slate-100"
    >
      {children}
    </button>
  );
}