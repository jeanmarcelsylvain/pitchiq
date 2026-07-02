/** @type {import('tailwindcss').Config}
 *  Mirrors src/design/tokens.ts — change values there first, then here.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Brand accent — warm coral-orange */
        pitch: {
          50:  '#fff1ee',
          100: '#ffd4cc',
          400: '#ff7a60',
          500: '#ff5a3c',
          600: '#e03c20',
          700: '#b22c12',
          900: '#4a1008',
        },
        /* Surfaces + text — rich near-black navy → deep indigo ramp */
        slate: {
          200: '#e2e0f0',
          300: '#c6c3de',
          400: '#9a97b8',
          500: '#7d7aa0',
          600: '#565380',
          700: '#38406e',
          800: '#252b4d',
          850: '#171c38',
          900: '#10142a',
          950: '#0a0d1c',
        },
        /* Semantic support */
        emerald: { 400: '#2dd4a0', 500: '#1db98a', 600: '#149a72' },
        ai:      { 400: '#7ab8ff', 500: '#4d9fff', 600: '#2a7fe0' }, // AI features only
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Inter', 'Barlow', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card:  '0 1px 2px rgba(4,6,16,0.5), 0 8px 32px rgba(4,6,16,0.35)',
        float: '0 4px 12px rgba(4,6,16,0.5), 0 24px 64px rgba(4,6,16,0.45)',
        nav:   '0 1px 0 rgba(37,43,77,0.6), 0 8px 24px rgba(4,6,16,0.35)',
        modal: '0 8px 24px rgba(4,6,16,0.6), 0 48px 96px rgba(4,6,16,0.5)',
        'glow-accent': '0 0 24px rgba(255,90,60,0.28)',
        'glow-ai':     '0 0 24px rgba(77,159,255,0.25)',
        /* legacy aliases used across app pages */
        'glow-green':    '0 0 20px rgba(255, 90, 60, 0.4)',
        'glow-green-sm': '0 0 10px rgba(255, 90, 60, 0.28)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        grain:        'grain 8s steps(10) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-2%, -3%)' },
          '30%': { transform: 'translate(3%, -2%)' },
          '50%': { transform: 'translate(-3%, 2%)' },
          '70%': { transform: 'translate(2%, 3%)' },
          '90%': { transform: 'translate(-2%, 2%)' },
        },
      },
    },
  },
  plugins: [],
}
