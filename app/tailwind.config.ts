import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Solana brand colors
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          blue: "#00C2FF",
          dark: "#0a0a0f",
          darker: "#060608",
        },
        // XP/Level colors
        level: {
          common: "#64748b",
          rare: "#00C2FF",
          epic: "#9945FF",
          legendary: "#FFD700",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "aurora":
          "linear-gradient(135deg, #9945FF 0%, #14F195 50%, #00C2FF 100%)",
        "solana-gradient":
          "linear-gradient(to right, #9945FF, #14F195)",
        "card-gradient":
          "linear-gradient(135deg, rgba(153,69,255,0.1) 0%, rgba(20,241,149,0.05) 100%)",
        "hero-gradient":
          "radial-gradient(ellipse at top left, rgba(153,69,255,0.3) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(20,241,149,0.2) 0%, transparent 60%)",
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "aurora": "aurora 8s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 20s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        "bounce-slow": "bounce 3s infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        aurora: {
          "0%": {
            backgroundPosition: "0% 50%",
            backgroundSize: "400% 400%",
          },
          "100%": {
            backgroundPosition: "100% 50%",
            backgroundSize: "400% 400%",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(153,69,255,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(153,69,255,0.7), 0 0 80px rgba(153,69,255,0.3)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(153,69,255,0.4)",
        "glow-green": "0 0 20px rgba(20,241,149,0.4)",
        "glow-blue": "0 0 20px rgba(0,194,255,0.4)",
        "card": "0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.5)",
        "card-hover": "0 0 0 1px rgba(153,69,255,0.3), 0 8px 32px rgba(153,69,255,0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
