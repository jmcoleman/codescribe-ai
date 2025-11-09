import { useRef, useState, lazy, Suspense } from 'react';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';
import Footer from './Footer';

// Lazy load modals
const HelpModal = lazy(() => import('./HelpModal').then(m => ({ default: m.HelpModal })));
const ContactSupportModal = lazy(() => import('./ContactSupportModal').then(m => ({ default: m.ContactSupportModal })));
const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.default })));

/**
 * PageLayout - Consistent layout wrapper for all secondary pages
 *
 * Provides consistent Header and Footer across all pages following industry
 * best practices from Stripe, GitHub, Linear, Notion, and Vercel.
 *
 * Features:
 * - Global header with logo, navigation, and user menu
 * - Mobile menu integration
 * - Global footer with legal links
 * - Optional background gradient
 * - Children prop for page-specific content
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content to render
 * @param {boolean} props.showGradient - Whether to show gradient background (default: true)
 * @param {string} props.className - Additional classes for main container
 */
export function PageLayout({ children, showGradient = true, className = '' }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const headerRef = useRef(null);

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  const handleSupportClick = () => {
    setShowSupportModal(true);
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
  };

  const backgroundClass = showGradient
    ? 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'
    : 'bg-slate-50 dark:bg-slate-900';

  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass}`}>
      {/* Global Header */}
      <Header
        ref={headerRef}
        onMenuClick={() => setShowMobileMenu(true)}
        onHelpClick={handleHelpClick}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        onHelpClick={handleHelpClick}
      />

      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      {/* Global Footer */}
      <Footer onSupportClick={handleSupportClick} />

      {/* Help Modal - Lazy loaded on demand */}
      {showHelpModal && (
        <Suspense fallback={null}>
          <HelpModal
            isOpen={showHelpModal}
            onClose={() => setShowHelpModal(false)}
          />
        </Suspense>
      )}

      {/* Contact Support Modal - Lazy loaded on demand */}
      {showSupportModal && (
        <Suspense fallback={null}>
          <ContactSupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            onShowLogin={handleShowLogin}
          />
        </Suspense>
      )}

      {/* Login Modal - Lazy loaded on demand */}
      {showLoginModal && (
        <Suspense fallback={null}>
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
