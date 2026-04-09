/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy & Ice White Palette
        ink: '#0F172A',          // Deep Navy Blue (Primary Text/Headers)
        navy: {
          700: '#1E293B',
          800: '#0F172A',
          900: '#020617',
          darkblue: '#0A192F',
          azure: '#007FFF',
          teal: '#14B8A6',
        emerald: '#10B981',
          ice: '#F0F9FF'
        },
        paper: '#F8FAFC',         // Ice White (Main Background)
        cream: '#F1F5F9',         // Subtle Slate (Card Backgrounds)
        azure: {
          DEFAULT: '#007FFF',     // Azure (Primary Action)
          light: '#3399FF',
          dark: '#005BB5',
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