import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { countryByIso, TOTAL_COUNTRIES, zoomForArea, type Country } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { useCityVisits } from "@/features/cities/queries";
import { CountrySheet } from "@/features/map/CountrySheet";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { WorldMap, type MapViewMode } from "@/features/map/WorldMap";
import { useTheme } from "@/hooks/useTheme";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraRef>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Country | null>(null);
  const [mode, setMode] = useState<MapViewMode>("countries");
  const { data: visits = [] } = useCountryVisits();
  const { data: cityVisits = [] } = useCityVisits();

  const visitedCount = visits.filter((v) => v.status === "visited" || v.status === "lived").length;
  const worldPercent = TOTAL_COUNTRIES > 0 ? Math.round((visitedCount / TOTAL_COUNTRIES) * 100) : 0;

  const openCountry = useCallback((country: Country, flyTo: boolean) => {
    setSelected(country);
    if (flyTo) {
      cameraRef.current?.flyTo({
        center: [country.lng, country.lat],
        zoom: zoomForArea(country.area),
        duration: 900,
      });
    }
    sheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1 bg-paper dark:bg-paper-dark">
      <WorldMap
        ref={cameraRef}
        visits={visits}
        selectedIso={selected?.iso ?? null}
        mode={mode}
        cityVisits={cityVisits}
        onCityPress={(id) => router.push(`/city/${id}`)}
        onCountryPress={(iso) => {
          if (mode !== "countries") return;
          const country = countryByIso.get(iso);
          if (country) openCountry(country, false);
        }}
      />

      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 px-4"
      >
        <MapSearchBar onSelect={(country) => openCountry(country, true)} />

        {/* Countries / Cities view toggle */}
        <View pointerEvents="box-none" className="mt-3 items-center">
          <View className="flex-row rounded-chip border border-line bg-paper-raised/95 p-1 dark:border-line-dark dark:bg-paper-dark-raised/95">
          {(["countries", "cities"] as MapViewMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-row items-center gap-1.5 rounded-chip px-4 py-2 ${
                mode === m ? "bg-primary dark:bg-primary-dark" : ""
              }`}
            >
              <Ionicons
                name={m === "countries" ? "earth" : "business"}
                size={14}
                color={mode === m ? "#FFFFFF" : colors.inkSoft}
              />
              <AppText
                className={`font-sans-semibold text-sm ${
                  mode === m ? "text-white" : "text-ink-soft dark:text-ink-dark-soft"
                }`}
              >
                {m === "countries" ? "Countries" : "Cities"}
              </AppText>
            </Pressable>
          ))}
          </View>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(500).springify()}
        pointerEvents="none"
        className="absolute bottom-5 left-4 flex-row gap-3"
      >
        <View className="rounded-2xl border border-line bg-paper-raised/95 px-4 py-2.5 dark:border-line-dark dark:bg-paper-dark-raised/95">
          <AppText variant="caption">{mode === "cities" ? "Cities" : "Countries"}</AppText>
          <AppText variant="title" className="text-xl">
            {mode === "cities" ? cityVisits.length : visitedCount}
          </AppText>
        </View>
        <View className="rounded-2xl border border-line bg-paper-raised/95 px-4 py-2.5 dark:border-line-dark dark:bg-paper-dark-raised/95">
          <AppText variant="caption">World</AppText>
          <AppText variant="title" className="text-xl">
            {worldPercent}%
          </AppText>
        </View>
      </Animated.View>

      <CountrySheet ref={sheetRef} country={selected} onDismiss={() => setSelected(null)} />
    </View>
  );
}
