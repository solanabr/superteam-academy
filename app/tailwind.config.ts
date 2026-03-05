import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Paleta Main: Verde do logo #008033 */
        brand: {
          green: "hsl(144 100% 25%)",
          "green-light": "hsl(144 100% 38%)",
          "green-dark": "hsl(144 100% 20%)",
          "green-deep": "hsl(144 100% 18%)",
          green1: "hsl(144 100% 38%)",
          green2: "hsl(144 100% 25%)",
          green3: "hsl(144 100% 18%)",
          "bg-dark": "hsl(120 12% 7%)",
          "header-green": "hsl(144 100% 25%)",
          "logo-yellow": "hsl(52 97% 51%)",
          "logo-yellow-hover": "hsl(52 97% 45%)",
        },
        /* Neutrals (light theme) */
        neutral: {
          bg: "hsl(40 33% 98%)",
          surface: "hsl(40 25% 96%)",
          "surface-2": "hsl(0 0% 100%)",
          border: "hsl(45 22% 88%)",
        },
        /* Footer Superteam Brasil */
        "footer-light": "hsl(40 28% 94%)",
        "footer-bg": "#212822",
        "footer-green": "#30783F",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
