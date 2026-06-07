/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0b",
          elevated: "#131316",
          hover: "#1a1a1f",
        },
        fg: {
          DEFAULT: "#fafafa",
          muted: "#a1a1aa",
          subtle: "#71717a",
          inverted: "#0a0a0b",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
        accent: {
          DEFAULT: "#22d3ee",
          hover: "#06b6d4",
          dim: "rgba(34, 211, 238, 0.1)",
        },
        danger: {
          DEFAULT: "#f87171",
          dim: "rgba(248, 113, 113, 0.1)",
        },
        success: "#4ade80",
        warning: "#fbbf24",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
      },
    },
  },
  plugins: [],
}