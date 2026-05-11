import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        heading: ["var(--font-heading)"]
      },
      colors: {
        brand: {
          DEFAULT: "oklch(var(--brand) / <alpha-value>)",
          foreground: "oklch(var(--brand-foreground) / <alpha-value>)"
        },
        accent: {
          strong: "oklch(var(--accent-strong) / <alpha-value>)",
          "strong-foreground": "oklch(var(--accent-strong-foreground) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;