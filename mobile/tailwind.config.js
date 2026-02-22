/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        border: "#F0F0F0",
        primary: "#E53935",
        "primary-dark": "#C62828",
        "primary-light": "#FFEBEE",
        accent: "#FF7043",
        text: "#212121",
        "text-muted": "#757575",
        "text-dim": "#BDBDBD",
        success: "#43A047",
        warning: "#FB8C00",
        danger: "#E53935",
        "core-tech": "#3b82f6",
        "dev-tools": "#43A047",
        "trend-insight": "#a855f7",
      },
    },
  },
  plugins: [],
};
