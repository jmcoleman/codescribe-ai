import { FileCode2, Menu, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { RateLimitIndicator } from './RateLimitIndicator';

export function Header({ onMenuClick, onExamplesClick, onHelpClick, showMobileMenu = false, rateLimitInfo }) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-purple">
              <FileCode2 className="w-6 h-6 text-white" />
            </div>

            {/* Title + Tagline */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-slate-900">
                CodeScribe AI
              </h1>
              <p className="text-xs text-slate-500 hidden lg:block">
                Intelligent Code Documentation
              </p>
            </div>
          </div>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-2">
            {/* Rate Limit Indicator */}
            {rateLimitInfo && (
              <div className="hidden sm:block">
                <RateLimitIndicator
                  remaining={rateLimitInfo.remaining}
                  limit={rateLimitInfo.limit}
                />
              </div>
            )}

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={onExamplesClick}
                onMouseEnter={() => {
                  // Preload ExamplesModal on hover to prevent layout shift on first click
                  import('./ExamplesModal').catch(() => {});
                }}
              >
                Examples
              </Button>

              {/* Help Icon Button */}
              <button
                onClick={onHelpClick}
                onMouseEnter={() => {
                  // Preload HelpModal on hover to prevent layout shift on first click
                  import('./HelpModal').catch(() => {});
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                aria-label="Help and FAQ"
                title="Help and FAQ"
              >
                <HelpCircle className="w-5 h-5 text-slate-600" />
              </button>

              <Button variant="dark">
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-slate-100 hover:scale-[1.05] rounded-lg transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}