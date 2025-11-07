import { useRef, useState } from 'react';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';
import Footer from './Footer';

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
  const headerRef = useRef(null);

  const handleHelpClick = () => {
    setShowHelpModal(true);
  };

  const backgroundClass = showGradient
    ? 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20'
    : 'bg-slate-50';

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
      <Footer />

      {/* Help Modal - Lazy loaded on demand */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          {/* Help modal will be rendered here */}
        </div>
      )}
    </div>
  );
}
