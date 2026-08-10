import type { Config } from 'tailwindcss'

/**
 * Georgia Licensed Child Care Network — navy/gold civic identity.
 * Source: the GLCCN design handoff and reference/BRAND-SPECIFICATION.md.
 *
 * Tone target: state professional association. Composed, trusted, civic.
 * Not childish, not partisan, not activist-aggressive.
 *
 * Gold is an accent only — rules, focus rings, small emphasis. It never carries
 * body text and never fills a large button: at these values it fails contrast
 * against white. Navy 900 on white or Navy 50 is the workhorse pairing.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F2340', // main text, buttons, dark surfaces
          700: '#1E3A5F', // hover, secondary dark
          500: '#3F5F8A', // secondary UI emphasis, labels
          300: '#9FB0C7', // muted text on dark
          200: '#CBD8E8', // body copy on dark
          100: '#E3E9F2', // borders
          50: '#F2F5F9', // quiet surfaces, page background
        },
        gold: {
          700: '#9A7B18', // small high-contrast accent copy only
          500: '#C9A227', // accent rule, focus ring, logo detail
          300: '#E8C97A', // gentle accents on dark
        },
        danger: {
          DEFAULT: '#8A1F11', // dark accessible red
          bg: '#FBF0EE',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // One radius across the system.
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
      },
      maxWidth: {
        frame: '44rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 35, 64, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
