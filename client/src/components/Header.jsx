import { Menu as MenuIcon, LogOut, User, FileText, Shield, ChevronDown, Settings, BarChart3, Sparkles } from 'lucide-react';
import { useState, lazy, Suspense, forwardRef, useImperativeHandle } from 'react';
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

export const Header = forwardRef(function Header({ onMenuClick, onHelpClick }, ref) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // List of admin emails (must match server-side list)
  const ADMIN_EMAILS = [
    'jenni.m.coleman@gmail.com',
  ];

  // Check if current user is an admin
  const isAdmin = isAuthenticated && user?.email && ADMIN_EMAILS.includes(user.email);

  // Context-aware pricing button label
  const getPricingLabel = () => {
    if (!isAuthenticated) return 'Pricing';
    if (user?.tier === 'free') return 'Upgrade';
    return 'Subscription';
  };

  // Format display name: First name only (industry standard), else email username
  const getDisplayName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    // Fallback to email username
    return user?.email?.split('@')[0] || 'Account';
  };

  const handleSignInClick = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openLoginModal: () => setShowLoginModal(true),
    openSignupModal: () => setShowSignupModal(true)
  }));

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Logo + Title */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            {/* Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:bg-purple-950/20 flex items-center justify-center shadow-purple dark:shadow-purple-dark p-1 transition-transform group-hover:scale-105 dark:border dark:border-purple-900/50">
              <Logo className="w-full h-full" aria-hidden="true" />
            </div>

            {/* Title + Tagline */}
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                CodeScribe AI
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden lg:block">
                Intelligent Code Documentation
              </p>
            </div>
          </Link>

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
                      <Menu.Button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {getDisplayName()}
                            </span>
                            {/* Tier badge */}
                            {user?.tier && user.tier !== 'free' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                <Sparkles className="w-3 h-3" aria-hidden="true" />
                                {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                      </Menu.Button>

                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 dark:ring-opacity-50 focus:outline-none z-50">
                        <div className="p-1">
                          {/* User info header */}
                          <div className="px-3 py-2 mb-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
                            {user?.tier && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5 capitalize">
                                {user.tier} Plan
                              </p>
                            )}
                          </div>

                          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/usage"
                                className={`${
                                  active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                              >
                                <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                Usage Dashboard
                              </Link>
                            )}
                          </Menu.Item>

                          {/* Admin Menu Item - Only visible to admins */}
                          {isAdmin && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/admin/usage"
                                  className={`${
                                    active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                  } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                                >
                                  <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                  Admin Dashboard
                                </Link>
                              )}
                            </Menu.Item>
                          )}

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/settings"
                                className={`${
                                  active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                              >
                                <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                Settings
                              </Link>
                            )}
                          </Menu.Item>

                          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/terms"
                                className={`${
                                  active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                              >
                                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                Terms of Service
                              </Link>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/privacy"
                                className={`${
                                  active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                              >
                                <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                Privacy Policy
                              </Link>
                            )}
                          </Menu.Item>

                          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`${
                                  active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                } group flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-md transition-colors`}
                              >
                                <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
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
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.05] rounded-lg transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" aria-hidden="true" />
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
});