/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'purple': '0 4px 20px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
}