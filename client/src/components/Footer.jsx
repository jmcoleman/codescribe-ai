/**
 * Footer Component
 * Displays legal links, copyright, and support information
 * Appears at the bottom of all main pages
 */

import { Link } from 'react-router-dom';

export default function Footer({ onSupportClick }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-slate-600 text-sm">
            © {currentYear} CodeScribe AI. All rights reserved.
          </div>

          {/* Legal Links */}
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/terms"
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <button
              onClick={onSupportClick}
              className="text-slate-600 hover:text-purple-600 transition-colors"
            >
              Support
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
