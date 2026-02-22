import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        /* ── Primary — Deep Teal ── */
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
          bg: "var(--primary-bg)",
          foreground: "#FFFFFF",
        },
        /* ── Accent — Warm Amber ── */
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          dark: "var(--accent-dark)",
          light: "var(--accent-light)",
          bg: "var(--accent-bg)",
          foreground: "#FFFFFF",
        },
        /* ── Secondary — Ink Teal ── */
        secondary: {
          DEFAULT: "var(--secondary)",
          light: "var(--secondary-light)",
          bg: "var(--secondary-bg)",
          foreground: "#FFFFFF",
        },
        /* ── Success — Botanical Green ── */
        success: {
          DEFAULT: "var(--success)",
          dark: "var(--success-dark)",
          light: "var(--success-light)",
          bg: "var(--success-bg)",
        },
        /* ── Streak — Flame Orange ── */
        streak: {
          DEFAULT: "var(--streak)",
          light: "var(--streak-light)",
        },
        /* ── Danger — Warm Coral ── */
        danger: {
          DEFAULT: "var(--danger)",
          dark: "var(--danger-dark)",
          light: "var(--danger-light)",
        },
        /* ── Solana Nod ── */
        solana: {
          purple: "var(--solana-purple)",
          green: "var(--solana-green)",
        },
        /* ── XP / Amber (V9 dashboard) ── */
        xp: {
          DEFAULT: "var(--xp)",
          dim: "var(--xp-dim)",
          dark: "var(--xp-dark)",
        },
        /* ── Gold metallic (medal/badge gradients) ── */
        gold: {
          hi: "var(--gold-hi)",
          ink: "var(--gold-ink)",
        },
        /* ── Level — Purple (V9 level badges, leaderboard) ── */
        level: {
          DEFAULT: "var(--level)",
          dim: "var(--level-dim)",
        },
        /* ── Activity heatmap (V9) ── */
        sg: {
          0: "var(--sg-0)",
          1: "var(--sg-1)",
          2: "var(--sg-2)",
          3: "var(--sg-3)",
          4: "var(--sg-4)",
          today: "var(--sg-today)",
        },
        /* ── Neutrals ── */
        bg: "var(--bg)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--text)",
        },
        subtle: "var(--subtle)",
        warm: "var(--warm)",
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text)",
          2: "var(--text-2)",
          3: "var(--text-3)",
        },
        /* ── Legacy shadcn compat ── */
        background: "var(--bg)",
        foreground: "var(--text)",
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "var(--subtle)",
          foreground: "var(--text-3)",
        },
        popover: {
          DEFAULT: "var(--card)",
          foreground: "var(--text)",
        },
        input: "var(--border)",
        ring: "var(--primary)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        body: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        push: "0 4px 0 0 var(--shadow-push-color)",
        "push-sm": "0 2px 0 0 var(--shadow-push-color)",
        "push-active": "0 1px 0 0 var(--shadow-push-color)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        glow: "var(--shadow-glow)",
        "glow-xp": "var(--shadow-glow-xp)",
        cert: "var(--shadow-cert)",
        "cert-hover": "var(--shadow-cert-hover)",
        "cert-lg": "var(--shadow-cert-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /* V9 Dashboard Panel animations */
        "dash-amb-a": {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(32px,24px)" },
        },
        "dash-amb-b": {
          "0%": { transform: "translate(0,0)" },
          "100%": { transform: "translate(-24px,16px)" },
        },
        "dm-in": {
          from: { opacity: "0", transform: "scale(0.5) translateY(6px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "dm-glow": {
          "0%,100%": {
            filter: "drop-shadow(0 4px 10px rgba(245,166,35,0.26))",
          },
          "50%": { filter: "drop-shadow(0 5px 16px rgba(245,166,35,0.50))" },
        },
        "dm-sol": {
          "0%,100%": {
            filter: "drop-shadow(0 4px 10px rgba(153,69,255,0.26))",
          },
          "50%": { filter: "drop-shadow(0 5px 18px rgba(20,241,149,0.46))" },
        },
        "today-cell": {
          "0%,100%": {
            boxShadow:
              "0 0 0 1.5px rgba(245,166,35,0.40), 0 0 7px rgba(245,166,35,0.36)",
          },
          "50%": {
            boxShadow:
              "0 0 0 2px rgba(245,166,35,0.60), 0 0 13px rgba(245,166,35,0.52)",
          },
        },
        "col-breathe": {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        flicker: {
          "0%": { transform: "scale(1) rotate(-2deg)" },
          "100%": { transform: "scale(1.08) rotate(2deg)" },
        },
        "lv-canopy-pulse": {
          "0%,100%": { boxShadow: "0 0 14px rgba(245,166,35,0.38)" },
          "50%": { boxShadow: "0 0 22px rgba(245,166,35,0.62)" },
        },
        /* V9: Lv 50+ legend badge — Solana iridescent pulse */
        "lv-legend-pulse": {
          "0%,100%": { boxShadow: "0 0 14px rgba(153,69,255,0.30)" },
          "50%": { boxShadow: "0 0 24px rgba(20,241,149,0.45)" },
        },
        /* V9: pop-spring — popup entry animation (XP, achievement, cert) */
        "pop-spring": {
          "0%": { opacity: "0", transform: "scale(0.72) translateY(12px)" },
          "55%": { transform: "scale(1.09) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "xp-pop": {
          "0%": { transform: "scale(0) translateY(0)", opacity: "0" },
          "20%": { transform: "scale(1.2) translateY(-8px)", opacity: "1" },
          "70%": { transform: "scale(1) translateY(-16px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-28px)", opacity: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        breathe: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.06)" },
        },
        pop: {
          "0%": {
            transform: "scale(0) translateY(20px)",
            opacity: "0",
          },
          "60%": {
            transform: "scale(1.12) translateY(-4px)",
          },
          "100%": {
            transform: "scale(1) translateY(0)",
            opacity: "1",
          },
        },
        "pulse-ring": {
          "0%, 100%": {
            boxShadow:
              "0 2px 0 0 var(--primary-dark), 0 0 0 0 rgba(13,148,136,0.3)",
          },
          "50%": {
            boxShadow:
              "0 2px 0 0 var(--primary-dark), 0 0 0 6px rgba(13,148,136,0)",
          },
        },
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      transitionDuration: {
        "600": "600ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "xp-pop": "xp-pop 2s ease-out forwards",
        shimmer: "shimmer 2.2s infinite",
        breathe: "breathe 2s infinite alternate ease-in-out",
        pop: "pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-ring": "pulse-ring 2s infinite",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        /* V9 Dashboard Panel animations */
        "dash-amb-a": "dash-amb-a 14s ease-in-out infinite alternate",
        "dash-amb-b": "dash-amb-b 11s ease-in-out infinite alternate",
        "dm-glow": "dm-glow 3.5s ease-in-out infinite",
        "dm-sol": "dm-sol 3.5s ease-in-out infinite",
        "today-cell": "today-cell 2s ease-in-out infinite",
        "col-breathe": "col-breathe 2.5s ease-in-out infinite",
        flicker: "flicker 1.5s ease-in-out infinite alternate",
        "lv-canopy-pulse": "lv-canopy-pulse 3s ease-in-out infinite",
        "lv-legend-pulse": "lv-legend-pulse 3s ease-in-out infinite",
        "pop-spring": "pop-spring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "dm-in": "dm-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
      backgroundImage: {
        "cert-gradient":
          "linear-gradient(135deg, var(--solana-purple) 0%, var(--solana-green) 100%)",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default config;
