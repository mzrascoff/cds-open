import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9dade",
          300: "#b8babf",
          400: "#8c8f97",
          500: "#666970",
          600: "#494b51",
          700: "#34363b",
          800: "#1f2024",
          900: "#0e0f12",
        },
        accent: {
          DEFAULT: "#c8102e",
          dark: "#9a0c24",
          soft: "#fbe9ec",
        },
        peer: {
          DEFAULT: "#94a3b8",
          band: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
