/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // "Sunset Orange" palette — vibrant orange on white, ember dark mode
        paper: {
          DEFAULT: "#FFFFFF",
          raised: "#FFFFFF",
          sunken: "#F7F4F1",
          dark: "#15100B",
          "dark-raised": "#211914",
          "dark-sunken": "#191310",
        },
        ink: {
          DEFAULT: "#1B1410",
          soft: "#5D4F44",
          faint: "#A3948A",
          dark: "#F8F4F0",
          "dark-soft": "#C7B8AC",
          "dark-faint": "#7A6C60",
        },
        primary: {
          DEFAULT: "#FF6B00",
          soft: "#FFF0E3",
          strong: "#E25800",
          dark: "#FF8A3D",
          "dark-soft": "#3B2410",
        },
        coral: {
          DEFAULT: "#E8175D",
          soft: "#FDE8F0",
          dark: "#FF4F8B",
          "dark-soft": "#3B1226",
        },
        gold: {
          DEFAULT: "#F5A623",
          soft: "#FEF3DE",
          dark: "#FFB84D",
          "dark-soft": "#332812",
        },
        slateblue: {
          DEFAULT: "#64798A",
          soft: "#EBF0F4",
          dark: "#8FA5B5",
          "dark-soft": "#20262E",
        },
        line: {
          DEFAULT: "#F0EAE4",
          dark: "#2E251E",
        },
        danger: {
          DEFAULT: "#E5484D",
          dark: "#FF6369",
        },
      },
      fontFamily: {
        display: ["SpaceGrotesk_600SemiBold"],
        "display-black": ["SpaceGrotesk_700Bold"],
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
      },
      borderRadius: {
        card: "24px",
        chip: "999px",
      },
    },
  },
  plugins: [],
};
