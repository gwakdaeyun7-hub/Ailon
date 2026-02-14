/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        surface: "#f5f5f5",
        card: "#ef5350",
        border: "#e0e0e0",
        primary: "#e53935",
        "primary-dark": "#c62828",
        accent: "#ff6b6b",
        text: "#1a1a1a",
        "text-muted": "#555555",
        "text-dim": "#999999",
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
