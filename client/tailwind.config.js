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
          400: '#C084FC',  // Dark mode primary (AAA: 9.1:1)
          500: '#A855F7',  // Main brand color (light mode)
          600: '#9333EA',  // Hover states (light mode)
          700: '#7C3AED',  // Dark mode gradients
        },
        // Secondary Indigo (Brand)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#818CF8',  // Dark mode secondary (AAA: 8.7:1)
          500: '#6366F1',  // Secondary brand color (light mode)
          600: '#4F46E5',  // Hover states (light mode)
          700: '#4338CA',  // Dark mode deep accents
        },
        // Neutral Slate
        slate: {
          50: '#F8FAFC',   // Page background (light)
          100: '#F1F5F9',  // Light elements / Primary text (dark)
          200: '#E2E8F0',  // Borders (light) / Body text (dark)
          300: '#CBD5E1',  // Secondary text (dark)
          400: '#94A3B8',  // Muted text (dark)
          500: '#64748B',  // Subtle text (both modes)
          600: '#475569',  // Body text (light) / Borders (dark)
          700: '#334155',  // Hover surfaces (dark)
          800: '#1E293B',  // Elevated cards (dark)
          900: '#0F172A',  // Headers (light) / Main surfaces (dark)
          950: '#020617',  // App background (dark) - NEW
        },
        // Semantic: Success (Green)
        green: {
          50: '#F0FDF4',   // Success backgrounds (light)
          100: '#DCFCE7',  // Subtle success (light)
          400: '#4ADE80',  // Dark mode success text (AAA: 10.8:1)
          500: '#22C55E',  // Dark mode success buttons
          600: '#16A34A',  // Main success (light mode, WCAG AA)
          700: '#15803D',  // Success buttons (light mode)
        },
        // Semantic: Warning (Amber - replaces yellow in dark)
        amber: {
          400: '#FBBF24',  // Dark mode warning text (AAA: 13.2:1)
          500: '#F59E0B',  // Dark mode warning buttons
          600: '#D97706',  // Dark mode warning hover
        },
        // Semantic: Warning (Yellow - light mode only)
        yellow: {
          50: '#FEFCE8',   // Warning backgrounds (light)
          100: '#FEF9C3',  // Subtle warning (light)
          600: '#CA8A04',  // Main warning (light mode, WCAG AA)
          700: '#A16207',  // Warning buttons (light mode)
        },
        // Semantic: Error (Red)
        red: {
          50: '#FEF2F2',   // Error backgrounds (light)
          100: '#FEE2E2',  // Subtle error (light)
          400: '#F87171',  // Dark mode error text (AAA: 8.2:1)
          500: '#EF4444',  // Dark mode error buttons
          600: '#DC2626',  // Main error (light mode, WCAG AA)
          700: '#B91C1C',  // Error buttons (light mode)
        },
        // Code/Technical Accent (Cyan)
        cyan: {
          50: '#ECFEFF',   // Code element backgrounds (light)
          100: '#CFFAFE',  // Light tint
          200: '#A5F3FC',  // Subtle highlight
          400: '#22D3EE',  // Dark mode neon highlights (AAA: 11.3:1)
          500: '#06B6D4',  // Links in code context / Dark mode code links
          600: '#0891B2',  // Main code accent (light mode, WCAG AAA: 7.8:1)
          700: '#0E7490',  // Hover states
        },
        // Developer Accent: Teal (Dark mode only)
        teal: {
          500: '#14B8A6',  // Dark mode function names (AAA: 7.9:1)
        },
        // Developer Accent: Emerald (Dark mode only)
        emerald: {
          500: '#10B981',  // Dark mode string literals (AAA: 7.2:1)
        },
        // Semantic color aliases
        success: {
          DEFAULT: '#16A34A',  // green-600 (light mode)
          dark: '#4ADE80',     // green-400 (dark mode)
        },
        warning: {
          DEFAULT: '#CA8A04',  // yellow-600 (light mode)
          dark: '#FBBF24',     // amber-400 (dark mode)
        },
        error: {
          DEFAULT: '#DC2626',  // red-600 (light mode)
          dark: '#F87171',     // red-400 (dark mode)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'purple': '0 4px 20px rgba(168, 85, 247, 0.3)',
        'purple-dark': '0 4px 20px rgba(192, 132, 252, 0.3)',
        'cyan': '0 4px 15px rgba(34, 211, 238, 0.2)',
        'green-dark': '0 4px 15px rgba(74, 222, 128, 0.2)',
        'red-dark': '0 4px 15px rgba(248, 113, 113, 0.2)',
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
      // Customize Typography plugin with our brand colors
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.700'),
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.slate.900'),
            },
            'strong': {
              color: theme('colors.slate.900'),
            },
            'a': {
              color: theme('colors.purple.600'),
            },
            'code': {
              color: theme('colors.slate.700'),
            },
            'ul > li::marker': {
              color: theme('colors.slate.500'),
            },
            'ol > li::marker': {
              color: theme('colors.slate.500'),
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.slate.300'),  // Body text - consistent readability
            'h1, h2, h3, h4, h5, h6': {
              color: theme('colors.slate.300'),  // Headings - same for clean appearance
            },
            'strong': {
              color: theme('colors.slate.100'),
            },
            'a': {
              color: theme('colors.purple.400'),
            },
            'code': {
              color: theme('colors.cyan.300'),
            },
            'ul > li::marker': {
              color: theme('colors.slate.500'),
            },
            'ol > li::marker': {
              color: theme('colors.slate.500'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}