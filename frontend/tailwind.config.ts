/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f4f2ff',
          100: '#ebe7ff',
          200: '#d9d1ff',
          300: '#beacff',
          400: '#9d7dff',
          500: '#7c4dff',
          600: '#6d28f7',
          700: '#5d1ae0',
          800: '#4e16bb',
          900: '#411499',
          950: '#260a66',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)',
        lift: '0 4px 12px rgba(0,0,0,.08), 0 16px 40px rgba(0,0,0,.12)',
      },
      animation: {
        'fade-in': 'fadeIn .3s ease-out',
        'slide-up': 'slideUp .3s ease-out',
        'pop': 'pop .25s ease-out',
        'slide-in': 'slideIn .25s ease-out',
        'fade-up': 'fadeUp .25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pop: { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(8px) scale(.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
    },
  },
  plugins: [],
};
