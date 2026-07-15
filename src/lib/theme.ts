/**
 * Sunfaded Atlas — design tokens.
 * Mirrors tailwind.config.js so native components (map layers, navigators,
 * status bars) can consume the same palette outside of className strings.
 */

export const palette = {
  light: {
    paper: "#FAF6EF",
    paperRaised: "#FFFFFF",
    paperSunken: "#F1EADD",
    ink: "#2C2318",
    inkSoft: "#5C5142",
    inkFaint: "#8A7D69",
    teal: "#0F6B66",
    tealSoft: "#DDEBE9",
    tealStrong: "#0A4B47",
    terracotta: "#C4593A",
    terracottaSoft: "#F5E3DC",
    gold: "#B8912C",
    goldSoft: "#F3EAD1",
    slate: "#64798A",
    slateSoft: "#E4E9ED",
    line: "#E4DCCC",
    danger: "#B33A3A",
    ocean: "#E8EFE9",
    landUnvisited: "#EFE7D8",
    border: "#C9BFA9",
  },
  dark: {
    paper: "#10201F",
    paperRaised: "#1A2E2C",
    paperSunken: "#0B1817",
    ink: "#EDE6D9",
    inkSoft: "#B8AE9D",
    inkFaint: "#847C6E",
    teal: "#3FA39C",
    tealSoft: "#173B39",
    tealStrong: "#5FC2BA",
    terracotta: "#E07A5A",
    terracottaSoft: "#3B241D",
    gold: "#D6B45A",
    goldSoft: "#332B14",
    slate: "#8FA5B5",
    slateSoft: "#22303A",
    line: "#28403D",
    danger: "#E06C6C",
    ocean: "#0B1A19",
    landUnvisited: "#1C2F2D",
    border: "#33504C",
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Palette = { [K in keyof (typeof palette)["light"]]: string };

/** Country status → map fill + UI accent colors */
export const statusColors = {
  visited: { light: "#0F6B66", dark: "#3FA39C" },
  lived: { light: "#C4593A", dark: "#E07A5A" },
  wishlist: { light: "#B8912C", dark: "#D6B45A" },
  transit: { light: "#64798A", dark: "#8FA5B5" },
} as const;

export type CountryStatus = keyof typeof statusColors;

export const STATUS_ORDER: CountryStatus[] = ["visited", "lived", "wishlist", "transit"];

export const statusLabels: Record<CountryStatus, string> = {
  visited: "Visited",
  lived: "Lived",
  wishlist: "Wishlist",
  transit: "Transit",
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBlack: "Fraunces_900Black",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;
