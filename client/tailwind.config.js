/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50:  '#ecfff4',
          100: '#c8ffe4',
          400: '#00e676',
          500: '#00c853',
          600: '#00a844',
          700: '#008535',
          900: '#003a18',
        },
        slate: {
          200: '#dde8f0',
          300: '#a8c4d8',
          400: '#6a95b3',
          500: '#4a7090',
          600: '#2d5070',
          700: '#133060',
          800: '#0d2240',
          850: '#081a30',
          900: '#071729',
          950: '#020b14',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        'glow-green':    '0 0 20px rgba(0, 200, 83, 0.35)',
        'glow-green-sm': '0 0 10px rgba(0, 200, 83, 0.25)',
        'card':          '0 4px 24px rgba(2, 11, 20, 0.6)',
      },
    },
  },
  plugins: [],
}
