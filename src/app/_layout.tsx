import "@/global.css";

import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { MapSheetProvider } from "@/features/map/MapSheetProvider";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { colorScheme as nativewindColorScheme } from "nativewind";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { useOtaUpdates } from "@/hooks/useOtaUpdates";
import { useTheme } from "@/hooks/useTheme";
import { TravelQueryProvider } from "@/lib/TravelQueryProvider";
import { usePreferences } from "@/stores/preferences";

if (Platform.OS !== "web") SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, ready } = useAuth();
  const { colors, isDark } = useTheme();
  const themePreference = usePreferences((s) => s.theme);

  useEffect(() => {
    nativewindColorScheme.set(themePreference);
  }, [themePreference]);

  useEffect(() => {
    if (ready && Platform.OS !== "web") SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View className="flex-1">
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="countries" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="country/[iso]" />
          <Stack.Screen name="city/[id]" />
          <Stack.Screen name="trip/new" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="stamps" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={Platform.OS === "web"}>
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useOtaUpdates();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <TravelQueryProvider>
            <MapSheetProvider>
              <RootNavigator />
            </MapSheetProvider>
          </TravelQueryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
