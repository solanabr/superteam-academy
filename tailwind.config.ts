import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        foreground: 'hsl(var(--foreground))',
        neon: {
          cyan: '#00F0FF',
          magenta: '#FF00FF',
          green: '#00FF41',
          yellow: '#FFFF00',
        },
        superteam: {
          emerald: '#129D49',
          forest: '#306C40',
          yellow: '#FBD800',
          navy: '#233A75',
          offwhite: '#FFF8E6',
        },
        terminal: {
          bg: 'hsl(var(--terminal-bg))',
          surface: 'hsl(var(--terminal-surface))',
          border: 'hsl(var(--terminal-border))',
        },
        solana: {
          purple: '#9945FF',
          green: '#14F195',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 0.5s infinite',
        'glow': 'glow 2s infinite alternate',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
