/**
 * Footer Component
 * Displays legal links, copyright, and support information
 * Appears at the bottom of all main pages
 */

import { Link } from 'react-router-dom';

export default function Footer({ onSupportClick }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 mt-auto transition-colors">
      <div className="max-w-7xl xl:max-w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-2 sm:py-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Copyright */}
          <div className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            © {currentYear} CodeScribe AI. All rights reserved.
          </div>

          {/* Legal Links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link
              to="/terms"
              className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <button
              onClick={onSupportClick}
              className="text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Support
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
