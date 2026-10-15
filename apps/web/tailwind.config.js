/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mint: { DEFAULT: '#70FC8E', 50: '#ECFFF0', 100: '#D4FEDC', 700: '#14833A' },
        cobalt: { DEFAULT: '#3765F6', 50: '#EEF2FF', 100: '#DCE5FE', 600: '#2A52D6', 700: '#1F3FB0' },
        mist: { DEFAULT: '#C3CED7', 50: '#F5F7F9', 100: '#E7ECF0', 500: '#8A99A6', 700: '#5B6875' },
        ghost: { DEFAULT: '#F2F3F6' },
        obsidian: { DEFAULT: '#181D25', 800: '#252B35', 600: '#4A5260' },
        danger: { DEFAULT: '#E5484D', 50: '#FFF0F0', 700: '#B4262B' },
        warning: { DEFAULT: '#F5B301', 50: '#FFF8E1', 700: '#9A6B00' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '28px',
        'card-sm': '24px',
        'card-lg': '32px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,29,37,.04), 0 8px 24px rgba(24,29,37,.04)',
        soft: '0 1px 2px rgba(24,29,37,.05), 0 2px 8px rgba(24,29,37,.04)',
        pop: '0 2px 4px rgba(24,29,37,.06), 0 16px 40px rgba(24,29,37,.12)',
        ring: '0 0 0 4px rgba(55,101,246,.15)',
        float: '0 12px 32px -8px rgba(24,29,37,.12), 0 2px 6px rgba(24,29,37,.04)',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out both',
        'fade-up': 'fade-up .35s cubic-bezier(.2,.8,.2,1) both',
        'scale-in': 'scale-in .22s cubic-bezier(.2,.8,.2,1) both',
        'slide-in-left': 'slide-in-left .25s cubic-bezier(.2,.8,.2,1) both',
        'toast-in': 'toast-in .25s cubic-bezier(.2,.8,.2,1) both',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
