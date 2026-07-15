import { useColorScheme } from "react-native";
import { palette, type ColorScheme, type Palette } from "@/lib/theme";
import { usePreferences } from "@/stores/preferences";

export function useResolvedScheme(): ColorScheme {
  const system = useColorScheme();
  const preference = usePreferences((s) => s.theme);
  if (preference === "system") return system === "dark" ? "dark" : "light";
  return preference;
}

export function useTheme(): { scheme: ColorScheme; colors: Palette; isDark: boolean } {
  const scheme = useResolvedScheme();
  return { scheme, colors: palette[scheme], isDark: scheme === "dark" };
}
