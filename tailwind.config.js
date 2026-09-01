/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, calming palette for elderly-friendly cognitive wellness app
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        sand: {
          50: '#fdfbf7',
          100: '#faf5ec',
          200: '#f3e9d2',
          300: '#e9d7b1',
          400: '#dcc288',
          500: '#cdaa63',
        },
        coral: {
          50: '#fff5f3',
          100: '#ffe8e3',
          200: '#ffd0c7',
          300: '#ffb0a1',
          400: '#ff8a75',
          500: '#f96f56',
          600: '#ec5638',
          700: '#c64428',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      maxWidth: {
        '4xl': '36rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(15, 118, 110, 0.06)',
        'soft-lg': '0 8px 30px rgba(15, 118, 110, 0.10)',
        'warm': '0 4px 14px rgba(249, 111, 86, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'gentle-pulse': 'gentlePulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
};
