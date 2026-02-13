/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#1a1a1a",
        card: "#242424",
        border: "#2e2e2e",
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        accent: "#8b5cf6",
        text: "#f0f0f0",
        "text-muted": "#888888",
        "text-dim": "#555555",
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
