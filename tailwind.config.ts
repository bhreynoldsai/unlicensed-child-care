import type { Config } from 'tailwindcss'

// TNS brand: navy / gold. Swap in exact hex values once the brand kit is confirmed.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5f9',
          100: '#e3e9f2',
          300: '#9fb2cd',
          500: '#3f5f8a',
          700: '#1e3a5f',
          900: '#0f2340',
        },
        gold: {
          300: '#e8c97a',
          500: '#c9a227',
          700: '#9a7b18',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
