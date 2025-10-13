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
        // Semantic Colors
        success: '#16A34A',
        warning: '#CA8A04',
        error: '#F87171',
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