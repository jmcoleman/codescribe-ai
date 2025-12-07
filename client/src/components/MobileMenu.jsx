import { X, LogOut, FileText, Shield, BarChart3, Settings, SlidersHorizontal, Clock } from 'lucide-react';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useTrial } from '../contexts/TrialContext';
import { AppearanceModal } from './AppearanceModal';
import { getEffectiveTier } from '../utils/tierFeatures';

// Lazy load auth modals
const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.LoginModal })));
const SignupModal = lazy(() => import('./SignupModal').then(m => ({ default: m.SignupModal })));
const ForgotPasswordModal = lazy(() => import('./ForgotPasswordModal').then(m => ({ default: m.ForgotPasswordModal })));

// Feature flag: Authentication enabled (from environment variable)
const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH === 'true';

export function MobileMenu({ isOpen, onClose, onHelpClick }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnTrial, trialTier, daysRemaining } = useTrial();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [allowClickOutside, setAllowClickOutside] = useState(false);

  // Admin roles that grant admin access
  const ADMIN_ROLES = ['admin', 'support', 'super_admin'];

  // Check if current user has admin privileges
  const isAdmin = isAuthenticated && user?.role && ADMIN_ROLES.includes(user.role);

  // Get effective tier and check for admin override
  const effectiveTier = getEffectiveTier(user);
  const hasAdminOverride = isAdmin && user?.effectiveTier && user.effectiveTier !== user.tier;

  // Check if user has Pro+ tier (pro, team, or enterprise)
  const hasProPlusTier = isAuthenticated && ['pro', 'team', 'enterprise'].includes(effectiveTier);

  // Context-aware pricing button label
  const getPricingLabel = () => {
    if (!isAuthenticated) return 'Pricing';
    if (user?.tier === 'free') return 'Upgrade';
    return 'Subscription';
  };

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

  const handleHelpClick = () => {
    onHelpClick();
    onClose();
  };

  const handlePricingClick = () => {
    navigate('/pricing');
    onClose();
  };

  const handleAppearanceClick = () => {
    setShowAppearanceModal(true);
    onClose();
  };

  const handleSignInClick = () => {
    setShowLoginModal(true);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
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

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself (not the menu content)
    if (allowClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Menu - only render when open */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleBackdropClick}
          />

          {/* Menu Panel */}
          <div
              data-testid="mobile-menu"
              className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-xl z-50 md:hidden transition-colors"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
            >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Menu</span>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.05] rounded transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            <MenuItem
              onClick={handlePricingClick}
            >
              {getPricingLabel()}
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

            {/* Appearance - for unauthenticated users only */}
            {!isAuthenticated && (
              <MenuItemWithIcon
                icon={SlidersHorizontal}
                onClick={handleAppearanceClick}
              >
                Appearance
              </MenuItemWithIcon>
            )}

            {/* Authenticated user links */}
            {ENABLE_AUTH && isAuthenticated && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                <MenuLink to="/usage" icon={BarChart3}>
                  My Usage
                </MenuLink>

                {/* Generation History - Only visible to Starter+ tier or admin users */}
                {(hasProPlusTier || isAdmin) && (
                  <MenuLink to="/history" icon={Clock}>
                    Generation History
                  </MenuLink>
                )}

                {/* Admin link - Only visible to admins */}
                {isAdmin && (
                  <MenuLink to="/admin" icon={Shield}>
                    Administration
                  </MenuLink>
                )}

                <MenuLink to="/settings" icon={Settings}>
                  Settings
                </MenuLink>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

            {/* Legal Links */}
            <MenuLink to="/terms" icon={FileText}>
              Terms of Service
            </MenuLink>
            <MenuLink to="/privacy" icon={Shield}>
              Privacy Policy
            </MenuLink>
          </nav>

          {/* Footer */}
          {ENABLE_AUTH && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              {isAuthenticated ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {user?.email || user?.name || 'User'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {isOnTrial
                      ? `${(trialTier || 'Pro').charAt(0).toUpperCase() + (trialTier || 'pro').slice(1)} Trial (${daysRemaining}d left)`
                      : hasAdminOverride
                        ? `${effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1)} Plan (Override)`
                        : effectiveTier ? `${effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1)} Plan` : 'Free Plan'
                    }
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="dark"
                  className="w-full"
                  onClick={handleSignInClick}
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Appearance Modal - for unauthenticated users */}
      <AppearanceModal
        isOpen={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
      />

      {/* Auth Modals - Rendered at same level as menu but with higher z-index */}
      {ENABLE_AUTH && (
        <>
          {showLoginModal && (
            <Suspense fallback={<div>Loading modal...</div>}>
              <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSwitchToSignup={switchToSignup}
                onSwitchToForgot={switchToForgot}
              />
            </Suspense>
          )}
          {showSignupModal && (
            <Suspense fallback={null}>
              <SignupModal
                isOpen={showSignupModal}
                onClose={() => setShowSignupModal(false)}
                onSwitchToLogin={switchToLogin}
              />
            </Suspense>
          )}
          {showForgotPasswordModal && (
            <Suspense fallback={null}>
              <ForgotPasswordModal
                isOpen={showForgotPasswordModal}
                onClose={() => setShowForgotPasswordModal(false)}
                onSwitchToLogin={switchToLogin}
              />
            </Suspense>
          )}
        </>
      )}
    </>
  );
}

function MenuItem({ children, onClick, onMouseEnter }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1 rounded-lg transition-all duration-200 motion-reduce:transition-none active:bg-slate-100 dark:active:bg-slate-700"
    >
      {children}
    </button>
  );
}

function MenuItemWithIcon({ icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1 rounded-lg transition-all duration-200 motion-reduce:transition-none active:bg-slate-100 dark:active:bg-slate-700"
    >
      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      {children}
    </button>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-x-1 rounded-lg transition-all duration-200 motion-reduce:transition-none active:bg-slate-100 dark:active:bg-slate-700"
    >
      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      {children}
    </Link>
  );
}