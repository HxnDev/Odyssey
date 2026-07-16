/**
 * "Sunset Orange" — Odyssey's signature theme.
 * Vibrant sunset orange on clean white; warm ember-black dark mode.
 * Mirrors tailwind.config.js so native components (map layers, navigators,
 * status bars) can consume the same palette outside of className strings.
 */

export const palette = {
  light: {
    paper: "#FFFFFF",
    paperRaised: "#FFFFFF",
    paperSunken: "#F7F4F1",
    ink: "#1B1410",
    inkSoft: "#5D4F44",
    inkFaint: "#A3948A",
    primary: "#FF6B00",
    primarySoft: "#FFF0E3",
    primaryStrong: "#E25800",
    coral: "#E8175D",
    coralSoft: "#FDE8F0",
    gold: "#F5A623",
    goldSoft: "#FEF3DE",
    slate: "#64798A",
    slateSoft: "#EBF0F4",
    line: "#F0EAE4",
    danger: "#E5484D",
    ocean: "#F7F4F0",
    landUnvisited: "#E8E1D9",
    border: "#FFFFFF",
    mapLabel: "#7C7168",
  },
  dark: {
    paper: "#15100B",
    paperRaised: "#211914",
    paperSunken: "#191310",
    ink: "#F8F4F0",
    inkSoft: "#C7B8AC",
    inkFaint: "#7A6C60",
    primary: "#FF8A3D",
    primarySoft: "#3B2410",
    primaryStrong: "#FFA262",
    coral: "#FF4F8B",
    coralSoft: "#3B1226",
    gold: "#FFB84D",
    goldSoft: "#332812",
    slate: "#8FA5B5",
    slateSoft: "#20262E",
    line: "#2E251E",
    danger: "#FF6369",
    ocean: "#15100B",
    landUnvisited: "#2B231C",
    border: "#15100B",
    mapLabel: "#8E7F72",
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Palette = { [K in keyof (typeof palette)["light"]]: string };

/** Country status → map fill + UI accent colors */
export const statusColors = {
  visited: { light: "#FF6B00", dark: "#FF8A3D" },
  lived: { light: "#E8175D", dark: "#FF4F8B" },
  wishlist: { light: "#0FA5A0", dark: "#2BC5BF" },
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
  display: "SpaceGrotesk_600SemiBold",
  displayBlack: "SpaceGrotesk_700Bold",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
} as const;
