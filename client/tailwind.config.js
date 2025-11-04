/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Use class-based dark mode (for Epic 3.1 toggle)
  theme: {
    extend: {
      colors: {
        // Primary Purple (Brand)
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          500: '#A855F7',  // Main brand color
          600: '#9333EA',  // Hover states
          700: '#7E22CE',
        },
        // Secondary Indigo (Brand)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',  // Secondary brand color
          600: '#4F46E5',  // Hover states
          700: '#4338CA',
        },
        // Neutral Slate
        slate: {
          50: '#F8FAFC',   // Page background
          100: '#F1F5F9',  // Light elements
          200: '#E2E8F0',  // Borders
          300: '#CBD5E1',
          500: '#64748B',  // Subtle text
          600: '#475569',  // Body text
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',  // Headers
        },
        // Semantic: Success (Green)
        green: {
          50: '#F0FDF4',   // Success backgrounds
          100: '#DCFCE7',  // Subtle success
          600: '#16A34A',  // Main success (WCAG AA)
          700: '#15803D',  // Success buttons
        },
        // Semantic: Warning (Yellow)
        yellow: {
          50: '#FEFCE8',   // Warning backgrounds
          100: '#FEF9C3',  // Subtle warning
          600: '#CA8A04',  // Main warning (WCAG AA)
          700: '#A16207',  // Warning buttons
        },
        // Semantic: Error (Red)
        red: {
          50: '#FEF2F2',   // Error backgrounds
          100: '#FEE2E2',  // Subtle error
          600: '#DC2626',  // Main error (WCAG AA compliant)
          700: '#B91C1C',  // Error buttons/destructive
        },
        // Code/Technical Accent (Cyan) - NEW in v2.0
        cyan: {
          50: '#ECFEFF',   // Code element backgrounds
          100: '#CFFAFE',  // Light tint
          200: '#A5F3FC',  // Subtle highlight
          500: '#06B6D4',  // Links in code context
          600: '#0891B2',  // Main code accent (WCAG AAA: 7.8:1)
          700: '#0E7490',  // Hover states
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'purple': '0 4px 20px rgba(168, 85, 247, 0.3)',
      },
      keyframes: {
        'toast-enter': {
          '0%': {
            transform: 'translateX(100%) scale(0.7)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
        },
        'toast-leave': {
          '0%': {
            transform: 'translateX(0) scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%) scale(0.7)',
            opacity: '0',
          },
        },
        'toast-bounce': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'slide-in-fade': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-slow': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(147, 51, 234, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(147, 51, 234, 0)',
          },
        },
        'subtle-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.02)',
          },
        },
        'spin-once': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },
      animation: {
        'toast-enter': 'toast-enter 0.3s ease-out',
        'toast-leave': 'toast-leave 0.2s ease-in forwards',
        'toast-bounce': 'toast-bounce 0.5s ease-in-out',
        'slide-in-fade': 'slide-in-fade 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 200ms ease-out forwards',
        'fade-in-slow': 'fade-in-slow 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-out': 'fade-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'subtle-pulse': 'subtle-pulse 2s ease-in-out infinite',
        'spin-once': 'spin-once 500ms ease-in-out forwards',
      },
    },
  },
  plugins: [],
}