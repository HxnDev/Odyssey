/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Sunfaded Atlas palette
        paper: {
          DEFAULT: "#FAF6EF",
          raised: "#FFFFFF",
          sunken: "#F1EADD",
          dark: "#10201F",
          "dark-raised": "#1A2E2C",
          "dark-sunken": "#0B1817",
        },
        ink: {
          DEFAULT: "#2C2318",
          soft: "#5C5142",
          faint: "#8A7D69",
          dark: "#EDE6D9",
          "dark-soft": "#B8AE9D",
          "dark-faint": "#847C6E",
        },
        teal: {
          DEFAULT: "#0F6B66",
          soft: "#DDEBE9",
          strong: "#0A4B47",
          dark: "#3FA39C",
          "dark-soft": "#173B39",
        },
        terracotta: {
          DEFAULT: "#C4593A",
          soft: "#F5E3DC",
          dark: "#E07A5A",
          "dark-soft": "#3B241D",
        },
        gold: {
          DEFAULT: "#B8912C",
          soft: "#F3EAD1",
          dark: "#D6B45A",
          "dark-soft": "#332B14",
        },
        slateblue: {
          DEFAULT: "#64798A",
          soft: "#E4E9ED",
          dark: "#8FA5B5",
          "dark-soft": "#22303A",
        },
        line: {
          DEFAULT: "#E4DCCC",
          dark: "#28403D",
        },
        danger: {
          DEFAULT: "#B33A3A",
          dark: "#E06C6C",
        },
      },
      fontFamily: {
        display: ["Fraunces_600SemiBold"],
        "display-black": ["Fraunces_900Black"],
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
      },
      borderRadius: {
        card: "20px",
        chip: "999px",
      },
    },
  },
  plugins: [],
};
