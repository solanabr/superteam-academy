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
        foreground: 'hsl(210 40% 98%)',
        neon: {
          cyan: '#00F0FF',
          magenta: '#FF00FF',
          green: '#00FF41',
          yellow: '#FFFF00',
        },
        terminal: {
          bg: '#0A0E14',
          surface: '#1A1F29',
          border: '#2D3748',
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
