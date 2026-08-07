import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./app/**/*.{tsx,ts}', './components/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:        'rgb(var(--brand-green) / <alpha-value>)',
          'green-hover': 'rgb(var(--brand-green-hover) / <alpha-value>)',
          dark:         'rgb(var(--brand-dark) / <alpha-value>)',
          neutral:      'rgb(var(--brand-neutral) / <alpha-value>)',
          'light-bg':   'rgb(var(--brand-light-bg) / <alpha-value>)',
        },
        sidebar: {
          bg:     'rgb(var(--sidebar-bg) / <alpha-value>)',
          active: 'rgb(var(--sidebar-active) / <alpha-value>)',
        },
        status: {
          success: 'rgb(var(--status-success) / <alpha-value>)',
          warning: 'rgb(var(--status-warning) / <alpha-value>)',
          error:   'rgb(var(--status-error) / <alpha-value>)',
          info:    'rgb(var(--status-info) / <alpha-value>)',
          review:  'rgb(var(--status-review) / <alpha-value>)',
        },
        background:  'rgb(var(--background) / <alpha-value>)',
        foreground:  'rgb(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT:    'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT:    'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border:  'rgb(var(--border) / <alpha-value>)',
        input:   'rgb(var(--input) / <alpha-value>)',
        ring:    'rgb(var(--ring) / <alpha-value>)',
        card: {
          DEFAULT:    'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT:    'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        body:    ['var(--font-body)'],
        arabic:  ['var(--font-arabic)'],
        heading: ['var(--font-heading)'],
        nav:     ['var(--font-nav)'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn:  'var(--radius-btn)',
        DEFAULT: 'var(--radius)',
      },
      maxWidth: {
        content: 'var(--max-width)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
