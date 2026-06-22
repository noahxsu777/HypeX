export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#ff3366', dark: '#cc0044', light: '#ff6699' },
        surface: { DEFAULT: '#1a1a2e', raised: '#16213e', card: '#0f3460' },
        bg: { primary: '#0a0a0a', secondary: '#111111', tertiary: '#1a1a1a' },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'pulse-slow': 'pulse 3s infinite',
        'bounce-subtle': 'bounceSubtle 1s infinite',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        bounceSubtle: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      }
    }
  },
  plugins: []
};
