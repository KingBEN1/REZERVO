import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: { ink: '#14231f', forest: '#14532d', moss: '#3f6212', sand: '#f7f8f4', line: '#e3e9e4' },
      boxShadow: { card: '0 8px 30px rgba(26, 54, 37, .08)' },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
} satisfies Config;
