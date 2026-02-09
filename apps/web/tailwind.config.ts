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
          light: "var(--danger-light)",
        },
        /* ── Solana Nod ── */
        solana: {
          purple: "var(--solana-purple)",
          green: "var(--solana-green)",
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
        "xp-pop": {
          "0%": { transform: "scale(0) translateY(0)", opacity: "0" },
          "20%": { transform: "scale(1.2) translateY(-8px)", opacity: "1" },
          "70%": { transform: "scale(1) translateY(-16px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-28px)", opacity: "0" },
        },
        shimmer: {
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
        shimmer: "shimmer 2s infinite",
        breathe: "breathe 2s infinite alternate ease-in-out",
        pop: "pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "pulse-ring": "pulse-ring 2s infinite",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
