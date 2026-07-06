/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b',
        },
      },
      boxShadow: {
        soft: '0 2px 8px rgba(15, 23, 42, 0.04)',
        card: '0 4px 16px rgba(15, 23, 42, 0.06)',
        elevated: '0 12px 40px rgba(15, 23, 42, 0.12)',
        brand: '0 4px 14px rgba(5, 150, 105, 0.25)',
        'brand-lg': '0 8px 24px rgba(5, 150, 105, 0.35)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.25rem' },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
      },
    },
  },
  plugins: [],
};
