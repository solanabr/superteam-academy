import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        card: {
          DEFAULT: "var(--bg-card)",
          hover: "var(--bg-card-hover)",
        },
        content: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        edge: {
          DEFAULT: "var(--border-primary)",
          soft: "var(--border-secondary)",
        },
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          cyan: "#00C2FF",
        },
      },
      backgroundImage: {
        "solana-gradient": "linear-gradient(to right, #9945FF, #00C2FF)",
      },
    },
  },
  plugins: [],
};
export default config;
