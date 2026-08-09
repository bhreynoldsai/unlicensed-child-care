import type { Config } from 'tailwindcss'

/**
 * Palette and type come from the "Organic" design system that the Claude Design
 * handoff was built on (design_handoff_signup_site). Those files are the visual
 * source of truth for the sign-up site.
 *
 * This replaces the earlier navy/gold placeholders. Sponsor branding is still an
 * open decision (Doc 01) — nothing here bakes in a company logo, and the
 * wordmark slot in app/layout.tsx stays typographic and swappable.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces and ink
        sand: '#f5ead8',
        surface: '#ebddc5',
        ink: '#201e1d',

        // Terracotta — primary accent
        accent: {
          DEFAULT: '#c67139',
          100: '#fff2eb',
          200: '#ffe1d0',
          300: '#ffc6a5',
          400: '#f6a06b',
          500: '#d67f48',
          600: '#b2622d',
          700: '#8c491a',
          800: '#643312',
          900: '#402310',
        },

        // Sage — secondary accent, carries the voluntary-participation notice
        sage: {
          DEFAULT: '#7a8a5e',
          100: '#f0fae1',
          200: '#e1eecc',
          300: '#ccdbb2',
          400: '#aebf92',
          500: '#8fa073',
          600: '#728157',
          700: '#56633f',
          800: '#3d472b',
          900: '#272e1b',
        },

        neutral: {
          100: '#f9f4ed',
          200: '#eee7db',
          300: '#dcd3c4',
          400: '#c0b6a5',
          500: '#a19786',
          600: '#82796a',
          700: '#645c50',
          800: '#474238',
          900: '#2e2b25',
        },

        // Muted red, dark enough to clear AA on the sand background
        danger: '#9c2a14',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '16px',
        lg: '28px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46, 43, 37, 0.14)',
        card: '0 3px 10px rgba(46, 43, 37, 0.16)',
      },
      spacing: {
        s1: '4.4px',
        s2: '8.8px',
        s3: '13.2px',
        s4: '17.6px',
        s6: '26.4px',
        s8: '35.2px',
      },
    },
  },
  plugins: [],
}

export default config
