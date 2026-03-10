/** @type {import('tailwindcss').Config} */
// Color values synced with mobile/lib/colors.ts
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAF9F6",
        surface: "#F5F2EE",
        card: "#FFFFFF",
        border: "#E7E5E4",
        primary: "#0D7377",
        "primary-dark": "#0A5C5F",
        "primary-light": "#F0FDFA",
        accent: "#B45309",
        text: "#1C1917",
        "text-muted": "#78716C",
        "text-dim": "#A8A29E",
        success: "#15803D",
        warning: "#D97706",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
