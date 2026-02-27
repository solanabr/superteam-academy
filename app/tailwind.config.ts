import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          muted: 'rgb(var(--border-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          muted: 'rgb(var(--accent-muted) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        chart: {
          1: 'rgb(var(--chart-1) / <alpha-value>)',
          2: 'rgb(var(--chart-2) / <alpha-value>)',
          3: 'rgb(var(--chart-3) / <alpha-value>)',
        },
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'title': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'body': ['0.9375rem', { lineHeight: '1.5rem' }],
        'caption': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 12px rgb(0 0 0 / 0.12)',
        'card-hover': '0 8px 24px rgb(0 0 0 / 0.18), 0 0 0 1px rgb(var(--accent) / 0.25)',
        'cta-glow': '0 0 20px rgb(var(--accent) / 0.35)',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
