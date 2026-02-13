import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        danger: 'hsl(var(--danger))'
      },
      borderRadius: {
        xl: '1rem'
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular']
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at 0% 0%, rgba(9,121,105,0.35), transparent 40%), radial-gradient(circle at 100% 100%, rgba(245,130,32,0.32), transparent 40%)'
      }
    }
  },
  plugins: []
};

export default config;
