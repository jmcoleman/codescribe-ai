/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Purple (Brand)
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C3AED',
        },
        // Secondary Indigo (Brand)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        // Neutral Slate
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Semantic: Success (Green)
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        // Semantic: Warning (Amber - replaces yellow in dark)
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        // Semantic: Warning (Yellow - light mode only)
        yellow: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          600: '#CA8A04',
          700: '#A16207',
        },
        // Semantic: Error (Red)
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // Code/Technical Accent (Cyan)
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        // Developer Accent: Teal (Dark mode only)
        teal: {
          500: '#14B8A6',
        },
        // Developer Accent: Emerald (Dark mode only)
        emerald: {
          500: '#10B981',
        },
        // Semantic color aliases
        success: {
          DEFAULT: '#16A34A',
          dark: '#4ADE80',
        },
        warning: {
          DEFAULT: '#CA8A04',
          dark: '#FBBF24',
        },
        error: {
          DEFAULT: '#DC2626',
          dark: '#F87171',
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
          '0%': { transform: 'translateX(100%) scale(0.7)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        'toast-leave': {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(100%) scale(0.7)', opacity: '0' },
        },
        'toast-bounce': {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        'slide-in-fade': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(147, 51, 234, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(147, 51, 234, 0)' },
        },
        'subtle-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'spin-once': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
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
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.700'),
            'h1, h2, h3, h4, h5, h6': { color: theme('colors.slate.900') },
            'strong': { color: theme('colors.slate.900') },
            'a': { color: theme('colors.purple.600') },
            'code': { color: theme('colors.slate.700') },
            'ul > li::marker': { color: theme('colors.slate.500') },
            'ol > li::marker': { color: theme('colors.slate.500') },
          },
        },
        invert: {
          css: {
            color: theme('colors.slate.300'),
            'h1, h2, h3, h4, h5, h6': { color: theme('colors.slate.300') },
            'strong': { color: theme('colors.slate.100') },
            'a': { color: theme('colors.purple.400') },
            'code': { color: theme('colors.cyan.300') },
            'ul > li::marker': { color: theme('colors.slate.500') },
            'ol > li::marker': { color: theme('colors.slate.500') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
}
