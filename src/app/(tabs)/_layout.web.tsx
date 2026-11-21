import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";

const screens = [
  { name: "index", title: "Map", icon: "earth-outline" },
  { name: "trips", title: "Trips", icon: "briefcase-outline" },
  { name: "passport", title: "Passport", icon: "id-card-outline" },
  { name: "settings", title: "Settings", icon: "settings-outline" },
] as const;

export default function WebTabsLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? "left" : "bottom",
        sceneStyle: { backgroundColor: colors.paper },
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarItemStyle: desktop
          ? {
              height: 48,
              marginHorizontal: 12,
              marginVertical: 3,
              borderRadius: 14,
            }
          : undefined,
        tabBarStyle: desktop
          ? {
              width: 184,
              paddingTop: 18,
              backgroundColor: colors.paperRaised,
              borderRightColor: colors.line,
              borderRightWidth: 1,
            }
          : {
              backgroundColor: colors.paperRaised,
              borderTopColor: colors.line,
            },
        tabBarLabelStyle: {
          fontFamily: fonts.sansSemibold,
          fontSize: 12,
        },
      }}
    >
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused && screen.name === "index" ? "earth" : screen.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
