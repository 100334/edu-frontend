/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Progress Schools teal, gold, and white palette
        ink: '#073F43',
        navy: {
          700: '#00676B',
          800: '#00565B',
          900: '#003B46',
          darkblue: '#003B46',
          azure: '#00858A',
          teal: '#00676B',
          emerald: '#2A9D8F',
          ice: '#F2FBFC'
        },
        paper: '#F2FBFC',
        cream: '#EAF4F2',
        azure: {
          DEFAULT: '#00676B',
          light: '#00858A',
          dark: '#00565B',
        },
        gold: {
          DEFAULT: '#F3C34A',
          light: '#FFD84D',
          dark: '#D9A923',
        },
        // Semantic Colors
        red: '#E63946',
        green: '#10B981',
        muted: '#64748B',         // Slate Gray (Secondary Text)
        border: '#E2E8F0',        // Ice Blue Border
      },
      fontFamily: {
        // Overriding sans to prioritize Calibri
        sans: ['Calibri', 'Candara', 'Segoe UI', 'Optima', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}