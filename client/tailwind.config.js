/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50:  '#fff1ee',
          100: '#ffd4cc',
          400: '#ff7a60',
          500: '#ff5a3c',
          600: '#e03c20',
          700: '#b22c12',
          900: '#4a1008',
        },
        slate: {
          200: '#e0d5f0',
          300: '#b8a0d8',
          400: '#8a70b8',
          500: '#5c4888',
          600: '#3d2e68',
          700: '#2a1e4c',
          800: '#1d1530',
          850: '#170f28',
          900: '#120c22',
          950: '#0d0818',
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
        'glow-green':    '0 0 20px rgba(255, 90, 60, 0.4)',
        'glow-green-sm': '0 0 10px rgba(255, 90, 60, 0.28)',
        'card':          '0 4px 24px rgba(2, 11, 20, 0.6)',
      },
    },
  },
  plugins: [],
}
