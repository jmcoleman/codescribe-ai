import { Menu as MenuIcon, LogOut, User, FileText, Shield, ChevronDown } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import { Button } from './Button';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';

// Lazy load auth modals
const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.LoginModal })));
const SignupModal = lazy(() => import('./SignupModal').then(m => ({ default: m.SignupModal })));
const ForgotPasswordModal = lazy(() => import('./ForgotPasswordModal').then(m => ({ default: m.ForgotPasswordModal })));

// Feature flag: Authentication enabled (from environment variable)
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

export function Header({ onMenuClick, onHelpClick }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Context-aware pricing button label
  const getPricingLabel = () => {
    if (!isAuthenticated) return 'Pricing';
    if (user?.tier === 'free') return 'Upgrade';
    return 'Subscription';
  };

  const handleSignInClick = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowForgotPasswordModal(false);
    setShowLoginModal(true);
  };

  const switchToForgot = () => {
    setShowLoginModal(false);
    setShowForgotPasswordModal(true);
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-purple p-1">
              <Logo className="w-full h-full" aria-hidden="true" />
            </div>

            {/* Title + Tagline */}
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                CodeScribe AI
              </h1>
              <p className="text-xs text-slate-600 hidden lg:block">
                Intelligent Code Documentation
              </p>
            </div>
          </div>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-2">
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/pricing')}
              >
                {getPricingLabel()}
              </Button>

              {/* Help Button - Desktop (text) */}
              <Button
                variant="secondary"
                onClick={onHelpClick}
                onMouseEnter={() => {
                  // Preload HelpModal on hover to prevent layout shift on first click
                  import('./HelpModal').catch(() => {});
                }}
              >
                Help
              </Button>

              {ENABLE_AUTH && (
                <>
                  {isAuthenticated ? (
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">
                        <User className="w-5 h-5 text-slate-600" aria-hidden="true" />
                        <span className="text-sm font-medium text-slate-700">
                          {user?.email?.split('@')[0] || 'Account'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      </Menu.Button>

                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/terms"
                                className={`${
                                  active ? 'bg-slate-100' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-md transition-colors`}
                              >
                                <FileText className="w-4 h-4 text-slate-500" aria-hidden="true" />
                                Terms of Service
                              </Link>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/privacy"
                                className={`${
                                  active ? 'bg-slate-100' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-md transition-colors`}
                              >
                                <Shield className="w-4 h-4 text-slate-500" aria-hidden="true" />
                                Privacy Policy
                              </Link>
                            )}
                          </Menu.Item>

                          <div className="h-px bg-slate-200 my-1" />

                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`${
                                  active ? 'bg-slate-100' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 rounded-md transition-colors`}
                              >
                                <LogOut className="w-4 h-4 text-slate-500" aria-hidden="true" />
                                Sign Out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Menu>
                  ) : (
                    <Button
                      variant="dark"
                      onClick={handleSignInClick}
                      onMouseEnter={() => {
                        // Preload auth modals on hover
                        import('./LoginModal').catch(() => {});
                      }}
                    >
                      Sign In
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              data-testid="mobile-menu-btn"
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-slate-100 hover:scale-[1.05] rounded-lg transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      {/* Auth Modals */}
      {ENABLE_AUTH && (
        <Suspense fallback={null}>
          {showLoginModal && (
            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSwitchToSignup={switchToSignup}
              onSwitchToForgot={switchToForgot}
            />
          )}

          {showSignupModal && (
            <SignupModal
              isOpen={showSignupModal}
              onClose={() => setShowSignupModal(false)}
              onSwitchToLogin={switchToLogin}
            />
          )}

          {showForgotPasswordModal && (
            <ForgotPasswordModal
              isOpen={showForgotPasswordModal}
              onClose={() => setShowForgotPasswordModal(false)}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </Suspense>
      )}
    </header>
  );
}