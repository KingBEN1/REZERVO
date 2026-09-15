import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: { ink: '#0b1220', forest: '#0f766e', moss: '#4f46e5', sand: '#f4f7fb', line: '#dbe4ef' },
      fontFamily: { sans: ['Manrope', 'ui-sans-serif', 'system-ui'], display: ['Sora', 'Manrope', 'sans-serif'] },
      boxShadow: { card: '0 18px 50px rgba(15, 23, 42, .09), 0 2px 8px rgba(15, 23, 42, .05)' },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
} satisfies Config;
