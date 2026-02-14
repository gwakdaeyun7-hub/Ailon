/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#141414",
        surface: "#1f1f1f",
        card: "#2a2a2a",
        border: "#363636",
        primary: "#e53935",
        "primary-dark": "#c62828",
        accent: "#ff6b6b",
        text: "#f5f5f5",
        "text-muted": "#a0a0a0",
        "text-dim": "#6a6a6a",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        "core-tech": "#3b82f6",
        "dev-tools": "#22c55e",
        "trend-insight": "#a855f7",
      },
    },
  },
  plugins: [],
};
